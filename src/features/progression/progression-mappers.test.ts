import { describe, expect, it } from "vitest";

import type {
  WorkoutSessionExerciseRow,
  WorkoutSetRow,
} from "../workouts/types";
import {
  mapProgressionRecommendationRow,
  prepareProgressionRecommendation,
} from "./progression-mappers";
import type { ProgressionRecommendationRow } from "./types";
import type { RecentProgressionExerciseRow } from "./types";

const EXERCISE_ROW: WorkoutSessionExerciseRow = {
  id: "current-exercise-id",
  user_id: "user-id",
  workout_session_id: "current-session-id",
  exercise_id: "bench-press-id",
  exercise_name_snapshot: "Bench Press",
  position: 1,
  target_sets: 3,
  min_reps: 8,
  max_reps: 10,
  planned_weight_value: 135,
  planned_weight_unit: "lb",
  planned_normalized_weight_lbs: 135,
  weight_increment_lbs: 5,
  created_at: "2026-09-01T16:00:00.000Z",
  updated_at: "2026-09-01T16:00:00.000Z",
};

describe("prepareProgressionRecommendation", () => {
  it("uses actual normalized working weight and stores versioned source context", () => {
    const currentSets = [
      _setRow("current-set-1", "current-exercise-id", 1, 140, 10),
      _setRow("current-set-2", "current-exercise-id", 2, 140, 10),
      _setRow("current-set-3", "current-exercise-id", 3, 140, 10),
    ];
    const recentRows = [
      _recentExerciseRow("recent-exercise-1", "recent-session-1"),
      _recentExerciseRow("recent-exercise-2", "recent-session-2"),
    ];

    const result = prepareProgressionRecommendation({
      exerciseRow: EXERCISE_ROW,
      setRows: currentSets,
      recentExerciseRows: recentRows,
    });

    expect(result).toMatchObject({
      workoutSessionExerciseId: "current-exercise-id",
      action: "increase",
      reason: "top_of_rep_range",
      recommendedWeightLbs: 145,
      recommendedMinReps: 8,
      recommendedMaxReps: 9,
      recommendedRir: 2,
      engineVersion: "double_progression_v1",
      inputSnapshot: {
        schema_version: "progression_input_v1",
        weight_basis: "rir_adjusted_set_capacity",
        source: {
          exercise_id: "bench-press-id",
          workout_session_id: "current-session-id",
          workout_session_exercise_id: "current-exercise-id",
        },
        recent_sessions: [
          {
            workout_session_id: "recent-session-1",
            workout_session_exercise_id: "recent-exercise-1",
          },
          {
            workout_session_id: "recent-session-2",
            workout_session_exercise_id: "recent-exercise-2",
          },
        ],
      },
    });
    expect(result?.inputSnapshot.performed_sets).toHaveLength(3);
    expect(result?.inputSnapshot.performed_sets[0]).toMatchObject({
      workout_set_id: "current-set-1",
      performed_at: "2026-09-01T16:05:00.000Z",
    });
  });

  it("does not create a recommendation for an exercise without working sets", () => {
    const result = prepareProgressionRecommendation({
      exerciseRow: EXERCISE_ROW,
      setRows: [
        {
          ..._setRow("warmup-set", "current-exercise-id", 1, 45, 10),
          kind: "warmup",
        },
      ],
      recentExerciseRows: [],
    });

    expect(result).toBeNull();
  });

  it("normalizes prescription fields missing from a legacy database row", () => {
    const legacyRow = {
      id: "recommendation-id",
      user_id: "user-id",
      workout_session_exercise_id: "current-exercise-id",
      action: "maintain",
      reason: "default_maintain",
      recommended_weight_lbs: 100,
      explanation: "Build consistency at this weight before changing it.",
      engine_version: "double_progression_v1",
      input_snapshot: {},
      created_at: "2026-09-01T17:00:00.000Z",
    } as ProgressionRecommendationRow;

    expect(mapProgressionRecommendationRow(legacyRow)).toMatchObject({
      recommendedWeightLbs: 100,
      recommendedMinReps: null,
      recommendedMaxReps: null,
      recommendedRir: null,
    });
  });
});

function _recentExerciseRow(
  id: string,
  workoutSessionId: string,
): RecentProgressionExerciseRow {
  return {
    id,
    exercise_id: "bench-press-id",
    workout_session_id: workoutSessionId,
    target_sets: 3,
    min_reps: 8,
    workoutSession: { started_at: "2026-08-30T16:00:00.000Z" },
    sets: [
      _setRow(`${id}-set-1`, id, 1, 140, 10),
      _setRow(`${id}-set-2`, id, 2, 140, 9),
      _setRow(`${id}-set-3`, id, 3, 140, 8),
    ],
  };
}

function _setRow(
  id: string,
  workoutSessionExerciseId: string,
  position: number,
  normalizedWeightLbs: number,
  reps: number,
): WorkoutSetRow {
  return {
    id,
    user_id: "user-id",
    workout_session_exercise_id: workoutSessionExerciseId,
    position,
    kind: "working",
    reps,
    weight_value: normalizedWeightLbs,
    weight_unit: "lb",
    normalized_weight_lbs: normalizedWeightLbs,
    rir: null,
    difficulty: null,
    pain: false,
    performed_at: "2026-09-01T16:05:00.000Z",
    created_at: "2026-09-01T16:05:00.000Z",
    updated_at: "2026-09-01T16:05:00.000Z",
  };
}
