import type {
  ActiveWorkoutSummary,
  PreviousExercisePerformance,
  PreviousWorkoutSessionExerciseRow,
  WorkoutSession,
  WorkoutSessionExercise,
  WorkoutSessionExerciseRow,
  WorkoutSessionRowWithTemplate,
  WorkoutSet,
  WorkoutSetRow,
} from "./types";

export function mapWorkoutSessionRowToActiveWorkoutSummary(
  row: WorkoutSessionRowWithTemplate,
): ActiveWorkoutSummary {
  return {
    id: row.id,
    templateName: row.template?.name ?? "Workout",
    startedAt: row.started_at,
  };
}

export function mapWorkoutSessionRowsToWorkoutSession(
  sessionRow: WorkoutSessionRowWithTemplate,
  exerciseRows: WorkoutSessionExerciseRow[],
  setRows: WorkoutSetRow[],
  previousExerciseRows: PreviousWorkoutSessionExerciseRow[] = [],
): WorkoutSession {
  const setsBySessionExerciseId = _groupSetsBySessionExerciseId(setRows);
  const previousPerformanceByExerciseId = new Map(
    previousExerciseRows.map((row) => [
      row.exercise_id,
      _mapPreviousExercisePerformance(row),
    ]),
  );

  return {
    id: sessionRow.id,
    templateName: sessionRow.template?.name ?? "Workout",
    status: sessionRow.status,
    startedAt: sessionRow.started_at,
    completedAt: sessionRow.completed_at,
    exercises: exerciseRows.map((row) =>
      _mapWorkoutSessionExerciseRow(
        row,
        setsBySessionExerciseId.get(row.id) ?? [],
        previousPerformanceByExerciseId.get(row.exercise_id) ?? null,
      ),
    ),
  };
}

export function mapWorkoutSetRowToWorkoutSet(row: WorkoutSetRow): WorkoutSet {
  return {
    id: row.id,
    position: row.position,
    reps: row.reps,
    weightValue: row.weight_value,
    weightUnit: row.weight_unit,
    normalizedWeightLbs: row.normalized_weight_lbs,
    performedAt: row.performed_at,
  };
}

function _mapWorkoutSessionExerciseRow(
  row: WorkoutSessionExerciseRow,
  sets: WorkoutSet[],
  previousPerformance: PreviousExercisePerformance | null,
): WorkoutSessionExercise {
  return {
    id: row.id,
    exerciseId: row.exercise_id,
    exerciseName: row.exercise_name_snapshot,
    position: row.position,
    targetSets: row.target_sets,
    minReps: row.min_reps,
    maxReps: row.max_reps,
    plannedWeightValue: row.planned_weight_value,
    plannedWeightUnit: row.planned_weight_unit,
    plannedNormalizedWeightLbs: row.planned_normalized_weight_lbs,
    weightIncrementLbs: row.weight_increment_lbs,
    previousPerformance,
    sets,
  };
}

function _mapPreviousExercisePerformance(
  row: PreviousWorkoutSessionExerciseRow,
): PreviousExercisePerformance {
  return {
    workoutSessionId: row.workout_session_id,
    workoutSessionExerciseId: row.id,
    startedAt: row.workoutSession.started_at,
    sets: row.sets.map(mapWorkoutSetRowToWorkoutSet),
  };
}

function _groupSetsBySessionExerciseId(
  rows: WorkoutSetRow[],
): Map<string, WorkoutSet[]> {
  const groups = new Map<string, WorkoutSet[]>();

  for (const row of rows) {
    const group = groups.get(row.workout_session_exercise_id) ?? [];

    group.push(mapWorkoutSetRowToWorkoutSet(row));
    groups.set(row.workout_session_exercise_id, group);
  }

  return groups;
}
