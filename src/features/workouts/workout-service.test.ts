import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  listProgressionRecommendationRows,
  listRecentProgressionExerciseRows,
} from "../progression/progression-queries";
import {
  listLatestStrengthRecordBaselinesByExercise,
  listStrengthRecordsForSessionExercises,
} from "../records/strength-record-queries";
import type {
  PersistedStrengthRecord,
  StrengthRecordType,
} from "../records/types";
import { completeWorkoutWithResultsRow } from "./workout-completion-queries";
import {
  getWorkoutSessionRow,
  listPreviousWorkoutSessionExerciseRows,
  listWorkoutSessionExerciseRows,
  listWorkoutSetRows,
  updateWorkoutSessionRow,
} from "./workout-queries";
import { finishWorkout, getWorkoutSession } from "./workout-service";
import type { ProgressionRecommendationRow } from "../progression/types";
import type {
  PreviousWorkoutSessionExerciseRow,
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

vi.mock("../records/strength-record-queries", () => ({
  listLatestStrengthRecordBaselinesByExercise: vi.fn(),
  listStrengthRecordsForSessionExercises: vi.fn(),
}));

vi.mock("./workout-completion-queries", () => ({
  completeWorkoutWithResultsRow: vi.fn(),
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

describe("getWorkoutSession", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(listWorkoutSetRows).mockResolvedValue([]);
    vi.mocked(listPreviousWorkoutSessionExerciseRows).mockResolvedValue([]);
    vi.mocked(listProgressionRecommendationRows).mockResolvedValue([]);
    vi.mocked(listStrengthRecordsForSessionExercises).mockResolvedValue([]);
  });

  it("loads carry-forward recommendations for the exact selected previous exercises", async () => {
    const previousExercise = _previousExerciseRow({
      id: "previous-session-exercise-id",
      workoutSessionId: "previous-session-id",
    });
    vi.mocked(getWorkoutSessionRow).mockResolvedValue(SESSION_ROW);
    vi.mocked(listWorkoutSessionExerciseRows).mockResolvedValue([
      EXERCISE_ROW,
    ]);
    vi.mocked(listPreviousWorkoutSessionExerciseRows).mockResolvedValue([
      previousExercise,
    ]);
    vi.mocked(listProgressionRecommendationRows).mockResolvedValue([
      _recommendationRow({
        id: "previous-recommendation-id",
        workoutSessionExerciseId: "previous-session-exercise-id",
        recommendedWeightLbs: 140,
      }),
    ]);

    const workout = await getWorkoutSession({
      userId: "user-id",
      sessionId: "session-id",
    });

    expect(listPreviousWorkoutSessionExerciseRows).toHaveBeenCalledWith({
      userId: "user-id",
      currentSessionId: "session-id",
      exerciseIds: ["bench-press-id"],
    });
    expect(listProgressionRecommendationRows).toHaveBeenCalledWith({
      userId: "user-id",
      sessionExerciseIds: ["previous-session-exercise-id"],
    });
    expect(listStrengthRecordsForSessionExercises).not.toHaveBeenCalled();
    expect(workout?.exercises[0].recommendation).toBeNull();
    expect(workout?.exercises[0].previousPerformance).toEqual(
      expect.objectContaining({
        workoutSessionId: "previous-session-id",
        workoutSessionExerciseId: "previous-session-exercise-id",
        targetSets: 3,
        recommendation: expect.objectContaining({
          id: "previous-recommendation-id",
          recommendedWeightLbs: 140,
        }),
      }),
    );
  });

  it("does not fall back to an older recommendation for active carry-forward data", async () => {
    vi.mocked(getWorkoutSessionRow).mockResolvedValue(SESSION_ROW);
    vi.mocked(listWorkoutSessionExerciseRows).mockResolvedValue([
      EXERCISE_ROW,
    ]);
    vi.mocked(listPreviousWorkoutSessionExerciseRows).mockResolvedValue([
      _previousExerciseRow({
        id: "selected-previous-session-exercise-id",
        workoutSessionId: "selected-previous-session-id",
      }),
    ]);
    vi.mocked(listProgressionRecommendationRows).mockResolvedValue([
      _recommendationRow({
        id: "older-recommendation-id",
        workoutSessionExerciseId: "older-session-exercise-id",
        recommendedWeightLbs: 135,
      }),
    ]);

    const workout = await getWorkoutSession({
      userId: "user-id",
      sessionId: "session-id",
    });

    expect(listProgressionRecommendationRows).toHaveBeenCalledWith({
      userId: "user-id",
      sessionExerciseIds: ["selected-previous-session-exercise-id"],
    });
    expect(workout?.exercises[0].previousPerformance?.recommendation).toBeNull();
  });

  it("keeps completed session recommendations attached to the completed exercise", async () => {
    vi.mocked(getWorkoutSessionRow).mockResolvedValue({
      ...SESSION_ROW,
      status: "completed",
      completed_at: "2026-09-01T17:00:00.000Z",
    });
    vi.mocked(listWorkoutSessionExerciseRows).mockResolvedValue([
      EXERCISE_ROW,
    ]);
    vi.mocked(listProgressionRecommendationRows).mockResolvedValue([
      _recommendationRow({
        id: "completed-recommendation-id",
        workoutSessionExerciseId: "session-exercise-id",
        recommendedWeightLbs: 140,
      }),
    ]);

    const workout = await getWorkoutSession({
      userId: "user-id",
      sessionId: "session-id",
    });

    expect(listPreviousWorkoutSessionExerciseRows).not.toHaveBeenCalled();
    expect(listProgressionRecommendationRows).toHaveBeenCalledWith({
      userId: "user-id",
      sessionExerciseIds: ["session-exercise-id"],
    });
    expect(workout?.exercises[0].previousPerformance).toBeNull();
    expect(workout?.exercises[0].recommendation).toEqual(
      expect.objectContaining({
        id: "completed-recommendation-id",
        recommendedWeightLbs: 140,
      }),
    );
  });

  it("does not load carry-forward data for cancelled sessions", async () => {
    vi.mocked(getWorkoutSessionRow).mockResolvedValue({
      ...SESSION_ROW,
      status: "cancelled",
    });
    vi.mocked(listWorkoutSessionExerciseRows).mockResolvedValue([
      EXERCISE_ROW,
    ]);

    const workout = await getWorkoutSession({
      userId: "user-id",
      sessionId: "session-id",
    });

    expect(listPreviousWorkoutSessionExerciseRows).not.toHaveBeenCalled();
    expect(listProgressionRecommendationRows).not.toHaveBeenCalled();
    expect(workout?.exercises[0].previousPerformance).toBeNull();
    expect(workout?.exercises[0].recommendation).toBeNull();
  });
});

describe("finishWorkout", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-09-01T17:00:00.000Z"));
    vi.mocked(listProgressionRecommendationRows).mockResolvedValue([]);
    vi.mocked(listRecentProgressionExerciseRows).mockResolvedValue([]);
    vi.mocked(listLatestStrengthRecordBaselinesByExercise).mockResolvedValue(
      new Map(),
    );
    vi.mocked(listStrengthRecordsForSessionExercises).mockResolvedValue([]);
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
    expect(completeWorkoutWithResultsRow).toHaveBeenCalledWith({
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
      strengthRecords: expect.arrayContaining([
        expect.objectContaining({
          workoutSessionExerciseId: "session-exercise-id",
          type: "highest_weight",
          value: 135,
          valueUnit: "lb",
          previousRecordId: null,
          performedAt: "2026-09-01T17:00:00.000Z",
        }),
        expect.objectContaining({
          type: "highest_volume",
          value: 4050,
          valueUnit: "lb_reps",
          previousRecordId: null,
          performedAt: "2026-09-01T17:00:00.000Z",
        }),
        expect.objectContaining({
          type: "highest_estimated_one_rep_max",
          value: 180,
          valueUnit: "lb",
          previousRecordId: null,
          performedAt: "2026-09-01T17:00:00.000Z",
        }),
      ]),
    });
    expect(
      vi.mocked(completeWorkoutWithResultsRow).mock.calls[0][0].strengthRecords,
    ).toHaveLength(3);
    expect(updateWorkoutSessionRow).not.toHaveBeenCalled();
  });

  it("sets previous record ids only for improvements over persisted baselines", async () => {
    vi.mocked(getWorkoutSessionRow).mockResolvedValue(SESSION_ROW);
    vi.mocked(listWorkoutSessionExerciseRows).mockResolvedValue([
      EXERCISE_ROW,
    ]);
    vi.mocked(listWorkoutSetRows).mockResolvedValue([
      _setRow(1, { normalizedWeightLbs: 140, reps: 10 }),
    ]);
    vi.mocked(listLatestStrengthRecordBaselinesByExercise).mockResolvedValue(
      new Map([
        [
          "bench-press-id",
          {
            highest_weight: _previousRecord({
              id: "previous-highest-weight-id",
              type: "highest_weight",
              value: 135,
            }),
            highest_estimated_one_rep_max: _previousRecord({
              id: "previous-estimated-id",
              type: "highest_estimated_one_rep_max",
              value: 190,
            }),
          },
        ],
      ]),
    );

    await finishWorkout({ userId: "user-id", sessionId: "session-id" });

    expect(completeWorkoutWithResultsRow).toHaveBeenCalledWith(
      expect.objectContaining({
        strengthRecords: expect.arrayContaining([
          expect.objectContaining({
            type: "highest_weight",
            previousRecordId: "previous-highest-weight-id",
          }),
          expect.objectContaining({
            type: "highest_volume",
            previousRecordId: null,
          }),
        ]),
      }),
    );
    expect(
      vi.mocked(completeWorkoutWithResultsRow).mock.calls[0][0].strengthRecords,
    ).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: "highest_estimated_one_rep_max",
        }),
      ]),
    );
  });

  it("does not prepare tied strength records", async () => {
    vi.mocked(getWorkoutSessionRow).mockResolvedValue(SESSION_ROW);
    vi.mocked(listWorkoutSessionExerciseRows).mockResolvedValue([
      EXERCISE_ROW,
    ]);
    vi.mocked(listWorkoutSetRows).mockResolvedValue([
      _setRow(1, { normalizedWeightLbs: 100, reps: 10 }),
    ]);
    vi.mocked(listLatestStrengthRecordBaselinesByExercise).mockResolvedValue(
      new Map([
        [
          "bench-press-id",
          {
            highest_weight: _previousRecord({
              type: "highest_weight",
              value: 100,
            }),
            highest_volume: _previousRecord({
              type: "highest_volume",
              value: 1000,
              valueUnit: "lb_reps",
            }),
            highest_estimated_one_rep_max: _previousRecord({
              type: "highest_estimated_one_rep_max",
              value: 133.33,
            }),
          },
        ],
      ]),
    );

    await finishWorkout({ userId: "user-id", sessionId: "session-id" });

    expect(completeWorkoutWithResultsRow).toHaveBeenCalledWith(
      expect.objectContaining({
        strengthRecords: [],
      }),
    );
  });

  it("uses only exercises with valid working sets for completion products", async () => {
    const squatRow: WorkoutSessionExerciseRow = {
      ...EXERCISE_ROW,
      id: "squat-session-exercise-id",
      exercise_id: "squat-id",
      exercise_name_snapshot: "Squat",
      position: 2,
    };
    vi.mocked(getWorkoutSessionRow).mockResolvedValue(SESSION_ROW);
    vi.mocked(listWorkoutSessionExerciseRows).mockResolvedValue([
      EXERCISE_ROW,
      squatRow,
    ]);
    vi.mocked(listWorkoutSetRows).mockResolvedValue([
      _setRow(1, { id: "bench-working", normalizedWeightLbs: 135, reps: 10 }),
      _setRow(2, {
        id: "bench-extra-working",
        normalizedWeightLbs: 95,
        reps: 5,
      }),
      _setRow(3, {
        id: "bench-warmup",
        kind: "warmup",
        normalizedWeightLbs: 500,
        reps: 10,
      }),
      _setRow(1, {
        id: "squat-invalid",
        sessionExerciseId: "squat-session-exercise-id",
        normalizedWeightLbs: 0,
        reps: 10,
      }),
      _setRow(2, {
        id: "squat-drop",
        sessionExerciseId: "squat-session-exercise-id",
        kind: "drop",
        normalizedWeightLbs: 300,
        reps: 10,
      }),
    ]);

    await finishWorkout({ userId: "user-id", sessionId: "session-id" });

    expect(listRecentProgressionExerciseRows).toHaveBeenCalledWith({
      userId: "user-id",
      currentSessionId: "session-id",
      exerciseIds: ["bench-press-id"],
    });
    expect(listLatestStrengthRecordBaselinesByExercise).toHaveBeenCalledWith({
      userId: "user-id",
      exerciseIds: ["bench-press-id"],
    });
    expect(completeWorkoutWithResultsRow).toHaveBeenCalledWith(
      expect.objectContaining({
        recommendations: [
          expect.objectContaining({
            workoutSessionExerciseId: "session-exercise-id",
          }),
        ],
        strengthRecords: expect.arrayContaining([
          expect.objectContaining({
            workoutSessionExerciseId: "session-exercise-id",
            type: "highest_volume",
            value: 1825,
          }),
        ]),
      }),
    );
    expect(
      vi.mocked(completeWorkoutWithResultsRow).mock.calls[0][0].strengthRecords,
    ).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          workoutSessionExerciseId: "squat-session-exercise-id",
        }),
      ]),
    );
  });

  it("prepares records for multiple participating exercises", async () => {
    const squatRow: WorkoutSessionExerciseRow = {
      ...EXERCISE_ROW,
      id: "squat-session-exercise-id",
      exercise_id: "squat-id",
      exercise_name_snapshot: "Squat",
      position: 2,
    };
    vi.mocked(getWorkoutSessionRow).mockResolvedValue(SESSION_ROW);
    vi.mocked(listWorkoutSessionExerciseRows).mockResolvedValue([
      EXERCISE_ROW,
      squatRow,
    ]);
    vi.mocked(listWorkoutSetRows).mockResolvedValue([
      _setRow(1, { normalizedWeightLbs: 135, reps: 10 }),
      _setRow(1, {
        sessionExerciseId: "squat-session-exercise-id",
        normalizedWeightLbs: 225,
        reps: 10,
      }),
    ]);

    await finishWorkout({ userId: "user-id", sessionId: "session-id" });

    expect(listRecentProgressionExerciseRows).toHaveBeenCalledWith({
      userId: "user-id",
      currentSessionId: "session-id",
      exerciseIds: ["bench-press-id", "squat-id"],
    });
    expect(completeWorkoutWithResultsRow).toHaveBeenCalledWith(
      expect.objectContaining({
        recommendations: [
          expect.objectContaining({
            workoutSessionExerciseId: "session-exercise-id",
          }),
          expect.objectContaining({
            workoutSessionExerciseId: "squat-session-exercise-id",
          }),
        ],
        strengthRecords: expect.arrayContaining([
          expect.objectContaining({
            workoutSessionExerciseId: "session-exercise-id",
          }),
          expect.objectContaining({
            workoutSessionExerciseId: "squat-session-exercise-id",
          }),
        ]),
      }),
    );
  });

  it("does not regenerate recommendations when completion is retried", async () => {
    vi.mocked(getWorkoutSessionRow).mockResolvedValue({
      ...SESSION_ROW,
      status: "completed",
      completed_at: "2026-09-01T17:00:00.000Z",
    });

    await finishWorkout({ userId: "user-id", sessionId: "session-id" });

    expect(listWorkoutSessionExerciseRows).not.toHaveBeenCalled();
    expect(completeWorkoutWithResultsRow).not.toHaveBeenCalled();
  });

  it("rejects an empty workout before calling the completion operation", async () => {
    vi.mocked(getWorkoutSessionRow).mockResolvedValue(SESSION_ROW);
    vi.mocked(listWorkoutSessionExerciseRows).mockResolvedValue([
      EXERCISE_ROW,
    ]);
    vi.mocked(listWorkoutSetRows).mockResolvedValue([]);

    await expect(
      finishWorkout({ userId: "user-id", sessionId: "session-id" }),
    ).rejects.toThrow(
      "Log at least one valid working set before finishing the workout.",
    );
    expect(completeWorkoutWithResultsRow).not.toHaveBeenCalled();
  });

  it("rejects workouts without a valid working set before completion", async () => {
    vi.mocked(getWorkoutSessionRow).mockResolvedValue(SESSION_ROW);
    vi.mocked(listWorkoutSessionExerciseRows).mockResolvedValue([
      EXERCISE_ROW,
    ]);
    vi.mocked(listWorkoutSetRows).mockResolvedValue([
      _setRow(1, { kind: "warmup", normalizedWeightLbs: 45, reps: 10 }),
      _setRow(2, { normalizedWeightLbs: 0, reps: 10 }),
      _setRow(3, { normalizedWeightLbs: 100, reps: 0 }),
    ]);

    await expect(
      finishWorkout({ userId: "user-id", sessionId: "session-id" }),
    ).rejects.toThrow(
      "Log at least one valid working set before finishing the workout.",
    );
    expect(listRecentProgressionExerciseRows).not.toHaveBeenCalled();
    expect(listLatestStrengthRecordBaselinesByExercise).not.toHaveBeenCalled();
    expect(completeWorkoutWithResultsRow).not.toHaveBeenCalled();
  });
});

function _setRow(
  position: number,
  overrides: Partial<{
    id: string;
    sessionExerciseId: string;
    kind: WorkoutSetRow["kind"];
    normalizedWeightLbs: number;
    reps: number;
  }> = {},
): WorkoutSetRow {
  return {
    id: overrides.id ?? `set-${position}`,
    user_id: "user-id",
    workout_session_exercise_id:
      overrides.sessionExerciseId ?? "session-exercise-id",
    position,
    kind: overrides.kind ?? "working",
    reps: overrides.reps ?? 10,
    weight_value: overrides.normalizedWeightLbs ?? 135,
    weight_unit: "lb",
    normalized_weight_lbs: overrides.normalizedWeightLbs ?? 135,
    rir: null,
    difficulty: null,
    pain: false,
    performed_at: "2026-09-01T16:05:00.000Z",
    created_at: "2026-09-01T16:05:00.000Z",
    updated_at: "2026-09-01T16:05:00.000Z",
  };
}

function _previousExerciseRow({
  id,
  workoutSessionId,
}: {
  id: string;
  workoutSessionId: string;
}): PreviousWorkoutSessionExerciseRow {
  return {
    id,
    exercise_id: "bench-press-id",
    target_sets: 3,
    workout_session_id: workoutSessionId,
    workoutSession: {
      started_at: "2026-08-28T16:00:00.000Z",
    },
    sets: [
      _setRow(1, {
        id: "previous-set-id",
        sessionExerciseId: id,
      }),
    ],
  };
}

function _recommendationRow({
  id,
  workoutSessionExerciseId,
  recommendedWeightLbs,
}: {
  id: string;
  workoutSessionExerciseId: string;
  recommendedWeightLbs: number;
}): ProgressionRecommendationRow {
  return {
    id,
    user_id: "user-id",
    workout_session_exercise_id: workoutSessionExerciseId,
    action: "increase",
    reason: "top_of_rep_range",
    recommended_weight_lbs: recommendedWeightLbs,
    recommended_min_reps: 8,
    recommended_max_reps: 10,
    recommended_rir: 2,
    explanation: "The prior performance supports another load increment.",
    engine_version: "double_progression_v1",
    input_snapshot: { schema_version: "progression_input_v1" },
    created_at: "2026-08-28T17:00:00.000Z",
  };
}

function _previousRecord({
  id = "previous-record-id",
  type,
  value,
  valueUnit,
}: {
  id?: string;
  type: StrengthRecordType;
  value: number;
  valueUnit?: PersistedStrengthRecord["valueUnit"];
}): PersistedStrengthRecord {
  return {
    id,
    userId: "user-id",
    workoutSessionExerciseId: "previous-session-exercise-id",
    previousRecordId: null,
    createdAt: "2026-08-01T17:00:00.000Z",
    type,
    value,
    valueUnit: valueUnit ?? (type === "highest_volume" ? "lb_reps" : "lb"),
    exerciseId: "bench-press-id",
    workoutSessionId: "previous-session-id",
    performedAt: "2026-08-01T17:00:00.000Z",
  };
}
