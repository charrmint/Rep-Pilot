import { describe, expect, it } from "vitest";

import {
  mapExerciseHistoryPerformanceRows,
  mapExerciseHistorySummaryRows,
  mapTemplateHistorySummaryRows,
  mapWorkoutHistorySessionRows,
} from "./workout-mappers";
import type {
  ExerciseHistoryPerformanceRow,
  ExerciseHistorySummaryRow,
  TemplateHistorySummaryRow,
  WorkoutHistorySessionRow,
  WorkoutSetRow,
} from "./types";

describe("workout history mappers", () => {
  it("maps historical sessions and keeps only working sets", () => {
    const rows: WorkoutHistorySessionRow[] = [
      {
        id: "session-id",
        user_id: "user-id",
        template_id: "template-id",
        status: "completed",
        started_at: "2026-09-01T16:00:00.000Z",
        completed_at: "2026-09-01T17:00:00.000Z",
        notes: null,
        created_at: "2026-09-01T16:00:00.000Z",
        updated_at: "2026-09-01T17:00:00.000Z",
        template: { name: "Push Day" },
        exercises: [
          {
            id: "session-exercise-id",
            exercise_id: "bench-press-id",
            exercise_name_snapshot: "Bench Press",
            position: 1,
            sets: [
              _workoutSetRow({ id: "working-set-id", kind: "working" }),
              _workoutSetRow({ id: "warmup-set-id", kind: "warmup" }),
            ],
          },
        ],
      },
    ];

    const workouts = mapWorkoutHistorySessionRows(rows);

    expect(workouts[0].templateName).toBe("Push Day");
    expect(workouts[0].exercises[0].sets).toHaveLength(1);
    expect(workouts[0].exercises[0].sets[0].id).toBe("working-set-id");
  });

  it("groups template sessions into most-recent-first summaries", () => {
    const rows: TemplateHistorySummaryRow[] = [
      _templateSummaryRow("2026-09-01T16:00:00.000Z"),
      _templateSummaryRow("2026-08-28T16:00:00.000Z"),
    ];

    expect(mapTemplateHistorySummaryRows(rows)).toEqual([
      {
        templateId: "template-id",
        templateName: "Push Day",
        isArchived: false,
        lastPerformedAt: "2026-09-01T16:00:00.000Z",
        workoutCount: 2,
      },
    ]);
  });

  it("groups exercise performances and preserves source session identity", () => {
    const summaryRows: ExerciseHistorySummaryRow[] = [
      _exerciseSummaryRow("2026-09-01T16:00:00.000Z"),
      _exerciseSummaryRow("2026-08-28T16:00:00.000Z"),
    ];
    const performanceRow: ExerciseHistoryPerformanceRow = {
      id: "session-exercise-id",
      exercise_id: "bench-press-id",
      exercise_name_snapshot: "Bench Press",
      workoutSession: {
        id: "session-id",
        template_id: "template-id",
        template: { name: "Push Day" },
        status: "completed",
        started_at: "2026-09-01T16:00:00.000Z",
        completed_at: "2026-09-01T17:00:00.000Z",
      },
      sets: [_workoutSetRow({ id: "working-set-id", kind: "working" })],
    };

    expect(mapExerciseHistorySummaryRows(summaryRows)[0]).toMatchObject({
      exerciseId: "bench-press-id",
      lastPerformedAt: "2026-09-01T16:00:00.000Z",
      performanceCount: 2,
    });
    expect(mapExerciseHistoryPerformanceRows([performanceRow])[0]).toMatchObject(
      {
        workoutSessionId: "session-id",
        templateId: "template-id",
        templateName: "Push Day",
      },
    );
  });
});

function _workoutSetRow({
  id,
  kind,
}: {
  id: string;
  kind: WorkoutSetRow["kind"];
}): WorkoutSetRow {
  return {
    id,
    user_id: "user-id",
    workout_session_exercise_id: "session-exercise-id",
    position: 1,
    kind,
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

function _templateSummaryRow(startedAt: string): TemplateHistorySummaryRow {
  return {
    template_id: "template-id",
    started_at: startedAt,
    template: {
      id: "template-id",
      name: "Push Day",
      is_archived: false,
    },
  };
}

function _exerciseSummaryRow(startedAt: string): ExerciseHistorySummaryRow {
  return {
    exercise_id: "bench-press-id",
    exercise_name_snapshot: "Bench Press",
    workoutSession: { started_at: startedAt },
    sets: [{ id: `set-${startedAt}` }],
  };
}
