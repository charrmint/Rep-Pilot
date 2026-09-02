import {
  mapExerciseHistoryPerformanceRows,
  mapExerciseHistorySummaryRows,
  mapTemplateHistorySummaryRows,
  mapWorkoutHistorySessionRows,
  mapWorkoutSessionRowsToWorkoutSession,
  mapWorkoutSessionRowToActiveWorkoutSummary,
  mapWorkoutSetRowToWorkoutSet,
} from "./workout-mappers";
import { prepareProgressionRecommendation } from "../progression/progression-mappers";
import {
  listProgressionRecommendationRows,
  listRecentProgressionExerciseRows,
} from "../progression/progression-queries";
import { completeWorkoutWithRecommendationsRow } from "./workout-completion-queries";
import {
  createWorkoutSetRow,
  deleteWorkoutSetRow,
  getActiveWorkoutSessionRow,
  getExerciseHistorySubjectRow,
  getWorkoutSessionExerciseRow,
  getWorkoutHistoryTemplateRow,
  getWorkoutSessionRow,
  listExerciseHistoryPerformanceRows,
  listExerciseHistorySummaryRows,
  listPreviousWorkoutSessionExerciseRows,
  listTemplateHistorySummaryRows,
  listWorkoutHistorySessionRows,
  listWorkoutSessionExerciseRows,
  listWorkoutSetRows,
  startWorkoutSession,
  updateWorkoutSessionRow,
  updateWorkoutSetRow,
} from "./workout-queries";
import type {
  ActiveWorkoutSummary,
  DeleteWorkoutSetInput,
  ExerciseHistory,
  ExerciseHistorySummary,
  PaginatedHistory,
  SaveWorkoutSetInput,
  StartWorkoutInput,
  TemplateHistory,
  TemplateHistorySummary,
  WorkoutHistorySession,
  WorkoutSession,
  WorkoutSessionExerciseRow,
  WorkoutSet,
} from "./types";
import {
  createPaginatedHistory,
  getWorkoutHistoryOffset,
} from "./workout-history";
import { validateWorkoutSetInput } from "./workout-validation";

const RECENT_WORKOUT_PAGE_SIZE = 10;
const TEMPLATE_WORKOUT_PAGE_SIZE = 3;
const EXERCISE_PERFORMANCE_PAGE_SIZE = 10;

export async function getActiveWorkout(
  userId: string,
): Promise<ActiveWorkoutSummary | null> {
  const row = await getActiveWorkoutSessionRow(userId);

  return row ? mapWorkoutSessionRowToActiveWorkoutSummary(row) : null;
}

export async function getWorkoutSession({
  userId,
  sessionId,
}: {
  userId: string;
  sessionId: string;
}): Promise<WorkoutSession | null> {
  const sessionRow = await getWorkoutSessionRow({ userId, sessionId });

  if (!sessionRow) {
    return null;
  }

  const exerciseRows = await listWorkoutSessionExerciseRows({
    userId,
    sessionId,
  });
  const sessionExerciseIds = exerciseRows.map((row) => row.id);
  const [setRows, previousExerciseRows, recommendationRows] = await Promise.all([
    listWorkoutSetRows({
      userId,
      sessionExerciseIds,
    }),
    sessionRow.status === "in_progress"
      ? listPreviousWorkoutSessionExerciseRows({
          userId,
          currentSessionId: sessionId,
          exerciseIds: exerciseRows.map((row) => row.exercise_id),
        })
      : Promise.resolve([]),
    sessionRow.status === "completed"
      ? listProgressionRecommendationRows({
          userId,
          sessionExerciseIds,
        })
      : Promise.resolve([]),
  ]);

  return mapWorkoutSessionRowsToWorkoutSession(
    sessionRow,
    exerciseRows,
    setRows,
    previousExerciseRows,
    recommendationRows,
  );
}

export async function listRecentWorkoutHistory({
  userId,
  page,
}: {
  userId: string;
  page: number;
}): Promise<PaginatedHistory<WorkoutHistorySession>> {
  const rows = await listWorkoutHistorySessionRows({
    userId,
    offset: getWorkoutHistoryOffset(page, RECENT_WORKOUT_PAGE_SIZE),
    limit: RECENT_WORKOUT_PAGE_SIZE + 1,
  });

  return createPaginatedHistory({
    items: mapWorkoutHistorySessionRows(rows),
    page,
    pageSize: RECENT_WORKOUT_PAGE_SIZE,
  });
}

export async function listTemplateHistorySummaries(
  userId: string,
): Promise<TemplateHistorySummary[]> {
  const rows = await listTemplateHistorySummaryRows(userId);

  return mapTemplateHistorySummaryRows(rows);
}

export async function getTemplateHistory({
  userId,
  templateId,
  page,
}: {
  userId: string;
  templateId: string;
  page: number;
}): Promise<TemplateHistory | null> {
  const templateRow = await getWorkoutHistoryTemplateRow({ userId, templateId });

  if (!templateRow) {
    return null;
  }

  const rows = await listWorkoutHistorySessionRows({
    userId,
    templateId,
    offset: getWorkoutHistoryOffset(page, TEMPLATE_WORKOUT_PAGE_SIZE),
    limit: TEMPLATE_WORKOUT_PAGE_SIZE + 1,
  });

  return {
    template: {
      id: templateRow.id,
      name: templateRow.name,
      isArchived: templateRow.is_archived,
    },
    workouts: createPaginatedHistory({
      items: mapWorkoutHistorySessionRows(rows),
      page,
      pageSize: TEMPLATE_WORKOUT_PAGE_SIZE,
    }),
  };
}

export async function listExerciseHistorySummaries(
  userId: string,
): Promise<ExerciseHistorySummary[]> {
  const rows = await listExerciseHistorySummaryRows(userId);

  return mapExerciseHistorySummaryRows(rows);
}

export async function getExerciseHistory({
  userId,
  exerciseId,
  page,
}: {
  userId: string;
  exerciseId: string;
  page: number;
}): Promise<ExerciseHistory | null> {
  const subjectRow = await getExerciseHistorySubjectRow(exerciseId);

  if (!subjectRow) {
    return null;
  }

  const rows = await listExerciseHistoryPerformanceRows({
    userId,
    exerciseId,
    offset: getWorkoutHistoryOffset(page, EXERCISE_PERFORMANCE_PAGE_SIZE),
    limit: EXERCISE_PERFORMANCE_PAGE_SIZE + 1,
  });

  return {
    exerciseId: subjectRow.id,
    exerciseName: subjectRow.name,
    performances: createPaginatedHistory({
      items: mapExerciseHistoryPerformanceRows(rows),
      page,
      pageSize: EXERCISE_PERFORMANCE_PAGE_SIZE,
    }),
  };
}

export async function startWorkout(input: StartWorkoutInput): Promise<string> {
  return startWorkoutSession(input);
}

export async function saveWorkoutSet({
  userId,
  input,
}: {
  userId: string;
  input: SaveWorkoutSetInput;
}): Promise<WorkoutSet> {
  const validatedInput = validateWorkoutSetInput(input);
  await _requireActiveSessionExercise(userId, input.sessionExerciseId);

  if (validatedInput.workoutSetId) {
    const row = await updateWorkoutSetRow({
      userId,
      sessionExerciseId: validatedInput.sessionExerciseId,
      workoutSetId: validatedInput.workoutSetId,
      update: {
        position: validatedInput.position,
        reps: validatedInput.reps,
        weight_value: validatedInput.weightValue,
        weight_unit: validatedInput.weightUnit,
        normalized_weight_lbs: validatedInput.normalizedWeightLbs,
        rir: validatedInput.rir,
      },
    });

    return mapWorkoutSetRowToWorkoutSet(row);
  }

  const row = await createWorkoutSetRow({
    user_id: userId,
    workout_session_exercise_id: validatedInput.sessionExerciseId,
    position: validatedInput.position,
    kind: "working",
    reps: validatedInput.reps,
    weight_value: validatedInput.weightValue,
    weight_unit: validatedInput.weightUnit,
    normalized_weight_lbs: validatedInput.normalizedWeightLbs,
    rir: validatedInput.rir,
  });

  return mapWorkoutSetRowToWorkoutSet(row);
}

export async function deleteWorkoutSet({
  userId,
  input,
}: {
  userId: string;
  input: DeleteWorkoutSetInput;
}): Promise<void> {
  await _requireActiveSessionExercise(userId, input.sessionExerciseId);
  await deleteWorkoutSetRow({ userId, ...input });
}

export async function finishWorkout({
  userId,
  sessionId,
}: {
  userId: string;
  sessionId: string;
}): Promise<void> {
  const sessionRow = await getWorkoutSessionRow({ userId, sessionId });

  if (!sessionRow) {
    throw new Error("Workout session not found.");
  }

  if (sessionRow.status === "completed") {
    return;
  }

  _requireInProgressStatus(sessionRow.status);

  const exerciseRows = await listWorkoutSessionExerciseRows({
    userId,
    sessionId,
  });
  const setRows = await listWorkoutSetRows({
    userId,
    sessionExerciseIds: exerciseRows.map((row) => row.id),
  });

  if (setRows.length === 0) {
    throw new Error("Log at least one set before finishing the workout.");
  }

  const exercisesWithWorkingSets = exerciseRows.filter((exerciseRow) =>
    setRows.some(
      (setRow) =>
        setRow.workout_session_exercise_id === exerciseRow.id &&
        setRow.kind === "working",
    ),
  );
  const recentExerciseRows = await listRecentProgressionExerciseRows({
    userId,
    currentSessionId: sessionId,
    exerciseIds: exercisesWithWorkingSets.map((row) => row.exercise_id),
  });
  const recommendations = exercisesWithWorkingSets.map((exerciseRow) => {
    const recommendation = prepareProgressionRecommendation({
      exerciseRow,
      setRows,
      recentExerciseRows,
    });

    if (!recommendation) {
      throw new Error("A logged working set must produce a recommendation.");
    }

    return recommendation;
  });

  await completeWorkoutWithRecommendationsRow({
    sessionId,
    completedAt: new Date().toISOString(),
    recommendations,
  });
}

export async function cancelWorkout({
  userId,
  sessionId,
}: {
  userId: string;
  sessionId: string;
}): Promise<void> {
  const workout = await getWorkoutSessionRow({ userId, sessionId });

  if (!workout) {
    throw new Error("Workout session not found.");
  }

  _requireInProgressStatus(workout.status);

  await updateWorkoutSessionRow({
    userId,
    sessionId,
    update: { status: "cancelled" },
  });
}

async function _requireActiveSessionExercise(
  userId: string,
  sessionExerciseId: string,
): Promise<WorkoutSessionExerciseRow> {
  const exercise = await getWorkoutSessionExerciseRow({
    userId,
    sessionExerciseId,
  });

  if (!exercise) {
    throw new Error("Workout exercise not found.");
  }

  const session = await getWorkoutSessionRow({
    userId,
    sessionId: exercise.workout_session_id,
  });

  if (!session) {
    throw new Error("Workout session not found.");
  }

  _requireInProgressStatus(session.status);

  return exercise;
}

function _requireInProgressStatus(status: string): void {
  if (status !== "in_progress") {
    throw new Error("This workout is no longer active.");
  }
}
