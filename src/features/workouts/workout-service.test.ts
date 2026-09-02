import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  listProgressionRecommendationRows,
  listRecentProgressionExerciseRows,
} from "../progression/progression-queries";
import { completeWorkoutWithRecommendationsRow } from "./workout-completion-queries";
import {
  getWorkoutSessionRow,
  listWorkoutSessionExerciseRows,
  listWorkoutSetRows,
  updateWorkoutSessionRow,
} from "./workout-queries";
import { finishWorkout } from "./workout-service";
import type {
  WorkoutSessionExerciseRow,
  WorkoutSessionRowWithTemplate,
  WorkoutSetRow,
} from "./types";

vi.mock("./workout-queries", () => ({
  createWorkoutSetRow: vi.fn(),
  deleteWorkoutSetRow: vi.fn(),
  getActiveWorkoutSessionRow: vi.fn(),
  getExerciseHistorySubjectRow: vi.fn(),
  getWorkoutHistoryTemplateRow: vi.fn(),
  getWorkoutSessionExerciseRow: vi.fn(),
  getWorkoutSessionRow: vi.fn(),
  listExerciseHistoryPerformanceRows: vi.fn(),
  listExerciseHistorySummaryRows: vi.fn(),
  listPreviousWorkoutSessionExerciseRows: vi.fn(),
  listTemplateHistorySummaryRows: vi.fn(),
  listWorkoutHistorySessionRows: vi.fn(),
  listWorkoutSessionExerciseRows: vi.fn(),
  listWorkoutSetRows: vi.fn(),
  startWorkoutSession: vi.fn(),
  updateWorkoutSessionRow: vi.fn(),
  updateWorkoutSetRow: vi.fn(),
}));

vi.mock("../progression/progression-queries", () => ({
  listProgressionRecommendationRows: vi.fn(),
  listRecentProgressionExerciseRows: vi.fn(),
}));

vi.mock("./workout-completion-queries", () => ({
  completeWorkoutWithRecommendationsRow: vi.fn(),
}));

const SESSION_ROW: WorkoutSessionRowWithTemplate = {
  id: "session-id",
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

const EXERCISE_ROW: WorkoutSessionExerciseRow = {
  id: "session-exercise-id",
  user_id: "user-id",
  workout_session_id: "session-id",
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

describe("finishWorkout", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-09-01T17:00:00.000Z"));
    vi.mocked(listProgressionRecommendationRows).mockResolvedValue([]);
    vi.mocked(listRecentProgressionExerciseRows).mockResolvedValue([]);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("persists recommendations and completion through one atomic operation", async () => {
    vi.mocked(getWorkoutSessionRow).mockResolvedValue(SESSION_ROW);
    vi.mocked(listWorkoutSessionExerciseRows).mockResolvedValue([
      EXERCISE_ROW,
    ]);
    vi.mocked(listWorkoutSetRows).mockResolvedValue([
      _setRow(1),
      _setRow(2),
      _setRow(3),
    ]);

    await finishWorkout({ userId: "user-id", sessionId: "session-id" });

    expect(listRecentProgressionExerciseRows).toHaveBeenCalledWith({
      userId: "user-id",
      currentSessionId: "session-id",
      exerciseIds: ["bench-press-id"],
    });
    expect(completeWorkoutWithRecommendationsRow).toHaveBeenCalledWith({
      sessionId: "session-id",
      completedAt: "2026-09-01T17:00:00.000Z",
      recommendations: [
        expect.objectContaining({
          workoutSessionExerciseId: "session-exercise-id",
          action: "increase",
          reason: "top_of_rep_range",
          recommendedWeightLbs: 140,
          recommendedMinReps: 8,
          recommendedMaxReps: 9,
          recommendedRir: 2,
          engineVersion: "double_progression_v1",
        }),
      ],
    });
    expect(updateWorkoutSessionRow).not.toHaveBeenCalled();
  });

  it("does not regenerate recommendations when completion is retried", async () => {
    vi.mocked(getWorkoutSessionRow).mockResolvedValue({
      ...SESSION_ROW,
      status: "completed",
      completed_at: "2026-09-01T17:00:00.000Z",
    });

    await finishWorkout({ userId: "user-id", sessionId: "session-id" });

    expect(listWorkoutSessionExerciseRows).not.toHaveBeenCalled();
    expect(completeWorkoutWithRecommendationsRow).not.toHaveBeenCalled();
  });

  it("rejects an empty workout before calling the completion operation", async () => {
    vi.mocked(getWorkoutSessionRow).mockResolvedValue(SESSION_ROW);
    vi.mocked(listWorkoutSessionExerciseRows).mockResolvedValue([
      EXERCISE_ROW,
    ]);
    vi.mocked(listWorkoutSetRows).mockResolvedValue([]);

    await expect(
      finishWorkout({ userId: "user-id", sessionId: "session-id" }),
    ).rejects.toThrow("Log at least one set before finishing the workout.");
    expect(completeWorkoutWithRecommendationsRow).not.toHaveBeenCalled();
  });
});

function _setRow(position: number): WorkoutSetRow {
  return {
    id: `set-${position}`,
    user_id: "user-id",
    workout_session_exercise_id: "session-exercise-id",
    position,
    kind: "working",
    reps: 10,
    weight_value: 135,
    weight_unit: "lb",
    normalized_weight_lbs: 135,
    rir: null,
    difficulty: null,
    pain: false,
    performed_at: "2026-09-01T16:05:00.000Z",
    created_at: "2026-09-01T16:05:00.000Z",
    updated_at: "2026-09-01T16:05:00.000Z",
  };
}
