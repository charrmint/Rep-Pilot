import { describe, expect, it } from "vitest";

import type {
  PreviousWorkoutSessionExerciseRow,
  WorkoutSessionExerciseRow,
  WorkoutSessionRowWithTemplate,
  WorkoutSetRow,
} from "./types";
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
