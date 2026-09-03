import { describe, expect, it } from "vitest";

import type {
  PreviousWorkoutSessionExerciseRow,
  WorkoutSessionExerciseRow,
  WorkoutSessionRowWithTemplate,
  WorkoutSetRow,
} from "./types";
import type { ProgressionRecommendationRow } from "../progression/types";
import type { PersistedStrengthRecord } from "../records/types";
import { mapWorkoutSessionRowsToWorkoutSession } from "./workout-mappers";

const SESSION_ROW: WorkoutSessionRowWithTemplate = {
  id: "current-session-id",
  user_id: "user-id",
  template_id: "template-id",
  status: "in_progress",
  started_at: "2026-09-01T16:00:00.000Z",
  completed_at: null,
  notes: null,
  created_at: "2026-09-01T16:00:00.000Z",
  updated_at: "2026-09-01T16:00:00.000Z",
  template: { name: "Upper A" },
};

const SESSION_EXERCISE_ROW: WorkoutSessionExerciseRow = {
  id: "current-session-exercise-id",
  user_id: "user-id",
  workout_session_id: "current-session-id",
  exercise_id: "bench-press-id",
  exercise_name_snapshot: "Bench Press",
  position: 1,
  target_sets: 3,
  min_reps: 8,
  max_reps: 12,
  planned_weight_value: 135,
  planned_weight_unit: "lb",
  planned_normalized_weight_lbs: 135,
  weight_increment_lbs: 5,
  created_at: "2026-09-01T16:00:00.000Z",
  updated_at: "2026-09-01T16:00:00.000Z",
};

describe("mapWorkoutSessionRowsToWorkoutSession", () => {
  it("attaches previous performance to the matching exercise", () => {
    const previousSet = _workoutSetRow({
      id: "previous-set-id",
      workoutSessionExerciseId: "previous-session-exercise-id",
    });
    const previousExercise: PreviousWorkoutSessionExerciseRow = {
      id: "previous-session-exercise-id",
      exercise_id: "bench-press-id",
      workout_session_id: "previous-session-id",
      workoutSession: {
        started_at: "2026-08-28T16:00:00.000Z",
      },
      sets: [previousSet],
    };

    const workout = mapWorkoutSessionRowsToWorkoutSession(
      SESSION_ROW,
      [SESSION_EXERCISE_ROW],
      [],
      [previousExercise],
    );

    expect(workout.exercises[0].previousPerformance).toEqual({
      workoutSessionId: "previous-session-id",
      workoutSessionExerciseId: "previous-session-exercise-id",
      startedAt: "2026-08-28T16:00:00.000Z",
      sets: [
        {
          id: "previous-set-id",
          position: 1,
          reps: 10,
          weightValue: 130,
          weightUnit: "lb",
          normalizedWeightLbs: 130,
          rir: null,
          performedAt: "2026-08-28T16:05:00.000Z",
        },
      ],
    });
  });

  it("uses null when the exercise has no previous performance", () => {
    const workout = mapWorkoutSessionRowsToWorkoutSession(
      SESSION_ROW,
      [SESSION_EXERCISE_ROW],
      [],
    );

    expect(workout.exercises[0].previousPerformance).toBeNull();
    expect(workout.exercises[0].recommendation).toBeNull();
    expect(workout.exercises[0].records).toEqual([]);
  });

  it("attaches a persisted recommendation to its source exercise", () => {
    const recommendation: ProgressionRecommendationRow = {
      id: "recommendation-id",
      user_id: "user-id",
      workout_session_exercise_id: "current-session-exercise-id",
      action: "increase",
      reason: "top_of_rep_range",
      recommended_weight_lbs: 140,
      recommended_min_reps: 8,
      recommended_max_reps: 10,
      recommended_rir: 2,
      explanation: "All target sets reached the top of the rep range.",
      engine_version: "double_progression_v1",
      input_snapshot: { schema_version: "progression_input_v1" },
      created_at: "2026-09-01T17:00:00.000Z",
    };

    const workout = mapWorkoutSessionRowsToWorkoutSession(
      { ...SESSION_ROW, status: "completed" },
      [SESSION_EXERCISE_ROW],
      [],
      [],
      [recommendation],
    );

    expect(workout.exercises[0].recommendation).toEqual({
      id: "recommendation-id",
      action: "increase",
      reason: "top_of_rep_range",
      recommendedWeightLbs: 140,
      recommendedMinReps: 8,
      recommendedMaxReps: 10,
      recommendedRir: 2,
      explanation: "All target sets reached the top of the rep range.",
      engineVersion: "double_progression_v1",
      inputSnapshot: { schema_version: "progression_input_v1" },
      createdAt: "2026-09-01T17:00:00.000Z",
    });
  });

  it("attaches completed strength records and nested previous records to their source exercise", () => {
    const strengthRecord: PersistedStrengthRecord = {
      id: "strength-record-id",
      userId: "user-id",
      workoutSessionExerciseId: "current-session-exercise-id",
      type: "highest_weight",
      value: 150,
      valueUnit: "lb",
      exerciseId: "bench-press-id",
      workoutSessionId: "current-session-id",
      performedAt: "2026-09-01T17:00:00.000Z",
      previousRecordId: "previous-record-id",
      createdAt: "2026-09-01T17:00:00.000Z",
      previousRecord: {
        type: "highest_weight",
        value: 145,
        valueUnit: "lb",
        exerciseId: "bench-press-id",
        workoutSessionId: "previous-session-id",
        performedAt: "2026-08-28T17:00:00.000Z",
      },
    };

    const workout = mapWorkoutSessionRowsToWorkoutSession(
      { ...SESSION_ROW, status: "completed" },
      [SESSION_EXERCISE_ROW],
      [],
      [],
      [],
      [strengthRecord],
    );

    expect(workout.exercises[0].records).toEqual([strengthRecord]);
  });
});

function _workoutSetRow({
  id,
  workoutSessionExerciseId,
}: {
  id: string;
  workoutSessionExerciseId: string;
}): WorkoutSetRow {
  return {
    id,
    user_id: "user-id",
    workout_session_exercise_id: workoutSessionExerciseId,
    position: 1,
    kind: "working",
    reps: 10,
    weight_value: 130,
    weight_unit: "lb",
    normalized_weight_lbs: 130,
    rir: null,
    difficulty: null,
    pain: false,
    performed_at: "2026-08-28T16:05:00.000Z",
    created_at: "2026-08-28T16:05:00.000Z",
    updated_at: "2026-08-28T16:05:00.000Z",
  };
}
