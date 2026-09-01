import {
  mapWorkoutSessionRowsToWorkoutSession,
  mapWorkoutSessionRowToActiveWorkoutSummary,
  mapWorkoutSetRowToWorkoutSet,
} from "./workout-mappers";
import {
  createWorkoutSetRow,
  deleteWorkoutSetRow,
  getActiveWorkoutSessionRow,
  getWorkoutSessionExerciseRow,
  getWorkoutSessionRow,
  listWorkoutSessionExerciseRows,
  listWorkoutSetRows,
  startWorkoutSession,
  updateWorkoutSessionRow,
  updateWorkoutSetRow,
} from "./workout-queries";
import type {
  ActiveWorkoutSummary,
  DeleteWorkoutSetInput,
  SaveWorkoutSetInput,
  StartWorkoutInput,
  WorkoutSession,
  WorkoutSessionExerciseRow,
  WorkoutSet,
} from "./types";
import { validateWorkoutSetInput } from "./workout-validation";

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
  const setRows = await listWorkoutSetRows({
    userId,
    sessionExerciseIds: exerciseRows.map((row) => row.id),
  });

  return mapWorkoutSessionRowsToWorkoutSession(
    sessionRow,
    exerciseRows,
    setRows,
  );
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
  const workout = await getWorkoutSession({ userId, sessionId });

  if (!workout) {
    throw new Error("Workout session not found.");
  }

  _requireInProgressStatus(workout.status);

  if (workout.exercises.every((exercise) => exercise.sets.length === 0)) {
    throw new Error("Log at least one set before finishing the workout.");
  }

  await updateWorkoutSessionRow({
    userId,
    sessionId,
    update: {
      status: "completed",
      completed_at: new Date().toISOString(),
    },
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
