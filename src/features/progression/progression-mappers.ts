import { recommendDoubleProgression } from "./double-progression";
import type {
  PerformedSet,
  PersistedProgressionRecommendation,
  PreparedProgressionRecommendation,
  ProgressionAuditSnapshotV1,
  ProgressionInput,
  ProgressionRecommendationRow,
  RecentExerciseSession,
  RecentProgressionExerciseRow,
} from "./types";
import type {
  WorkoutSessionExerciseRow,
  WorkoutSetRow,
} from "../workouts/types";

const ENGINE_VERSION = "double_progression_v1";

export function prepareProgressionRecommendation({
  exerciseRow,
  setRows,
  recentExerciseRows,
}: {
  exerciseRow: WorkoutSessionExerciseRow;
  setRows: WorkoutSetRow[];
  recentExerciseRows: RecentProgressionExerciseRow[];
}): PreparedProgressionRecommendation | null {
  const exerciseSetRows = setRows
    .filter((row) => row.workout_session_exercise_id === exerciseRow.id)
    .sort((left, right) => left.position - right.position);

  if (!exerciseSetRows.some((row) => row.kind === "working")) {
    return null;
  }

  const matchingRecentRows = recentExerciseRows
    .filter((row) => row.exercise_id === exerciseRow.exercise_id)
    .sort(
      (left, right) =>
        Date.parse(right.workoutSession.started_at) -
        Date.parse(left.workoutSession.started_at),
    )
    .slice(0, 2);
  const input = _toProgressionInput(
    exerciseRow,
    exerciseSetRows,
    matchingRecentRows,
  );
  const recommendation = recommendDoubleProgression(input);

  return {
    workoutSessionExerciseId: exerciseRow.id,
    action: recommendation.action,
    reason: recommendation.reason,
    recommendedWeightLbs: recommendation.recommendedWeight,
    recommendedMinReps: recommendation.recommendedMinReps,
    recommendedMaxReps: recommendation.recommendedMaxReps,
    recommendedRir: recommendation.recommendedRir,
    explanation: recommendation.explanation,
    engineVersion: ENGINE_VERSION,
    inputSnapshot: _toAuditSnapshot(
      exerciseRow,
      exerciseSetRows,
      matchingRecentRows,
    ),
  };
}

export function mapProgressionRecommendationRow(
  row: ProgressionRecommendationRow,
): PersistedProgressionRecommendation {
  return {
    id: row.id,
    action: row.action,
    reason: row.reason,
    recommendedWeightLbs: row.recommended_weight_lbs ?? null,
    recommendedMinReps: row.recommended_min_reps ?? null,
    recommendedMaxReps: row.recommended_max_reps ?? null,
    recommendedRir: row.recommended_rir ?? null,
    explanation: row.explanation,
    engineVersion: row.engine_version,
    inputSnapshot: row.input_snapshot,
    createdAt: row.created_at,
  };
}

function _toProgressionInput(
  exerciseRow: WorkoutSessionExerciseRow,
  setRows: WorkoutSetRow[],
  recentExerciseRows: RecentProgressionExerciseRow[],
): ProgressionInput {
  return {
    config: {
      targetSets: exerciseRow.target_sets,
      minReps: exerciseRow.min_reps,
      maxReps: exerciseRow.max_reps,
      weightIncrement: exerciseRow.weight_increment_lbs,
    },
    performedSets: setRows.map(_toPerformedSet),
    recentSessions: recentExerciseRows.map(_toRecentExerciseSession),
  };
}

function _toPerformedSet(row: WorkoutSetRow): PerformedSet {
  return {
    kind: row.kind,
    reps: row.reps,
    weight: row.normalized_weight_lbs,
    ...(row.rir === null ? {} : { rir: row.rir }),
    ...(row.difficulty === null ? {} : { difficulty: row.difficulty }),
    pain: row.pain,
  };
}

function _toRecentExerciseSession(
  row: RecentProgressionExerciseRow,
): RecentExerciseSession {
  return {
    targetSets: row.target_sets,
    minReps: row.min_reps,
    workingSets: [...row.sets]
      .filter((set) => set.kind === "working")
      .sort((left, right) => left.position - right.position)
      .map((set) => ({
        reps: set.reps,
        weight: set.normalized_weight_lbs,
        ...(set.rir === null ? {} : { rir: set.rir }),
      })),
  };
}

function _toAuditSnapshot(
  exerciseRow: WorkoutSessionExerciseRow,
  setRows: WorkoutSetRow[],
  recentExerciseRows: RecentProgressionExerciseRow[],
): ProgressionAuditSnapshotV1 {
  return {
    schema_version: "progression_input_v1",
    weight_basis: "rir_adjusted_set_capacity",
    source: {
      exercise_id: exerciseRow.exercise_id,
      workout_session_id: exerciseRow.workout_session_id,
      workout_session_exercise_id: exerciseRow.id,
    },
    config: {
      target_sets: exerciseRow.target_sets,
      min_reps: exerciseRow.min_reps,
      max_reps: exerciseRow.max_reps,
      weight_increment_lbs: exerciseRow.weight_increment_lbs,
    },
    performed_sets: setRows.map((set) => ({
      workout_set_id: set.id,
      position: set.position,
      kind: set.kind,
      reps: set.reps,
      normalized_weight_lbs: set.normalized_weight_lbs,
      rir: set.rir,
      difficulty: set.difficulty,
      pain: set.pain,
      performed_at: set.performed_at,
    })),
    recent_sessions: recentExerciseRows.map((row) => ({
      workout_session_id: row.workout_session_id,
      workout_session_exercise_id: row.id,
      started_at: row.workoutSession.started_at,
      target_sets: row.target_sets,
      min_reps: row.min_reps,
      working_sets: [...row.sets]
        .filter((set) => set.kind === "working")
        .sort((left, right) => left.position - right.position)
        .map((set) => ({
          workout_set_id: set.id,
          position: set.position,
          reps: set.reps,
          normalized_weight_lbs: set.normalized_weight_lbs,
          rir: set.rir,
          performed_at: set.performed_at,
        })),
    })),
  };
}
