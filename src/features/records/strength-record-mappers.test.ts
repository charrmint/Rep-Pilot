import { describe, expect, it } from "vitest";

import {
  attachPreviousStrengthRecords,
  filterValidWorkingStrengthSetRows,
  mapStrengthRecordRowsToLatestBaselines,
  mapStrengthRecordRowToPersistedStrengthRecord,
  prepareStrengthRecords,
} from "./strength-record-mappers";
import type { PersistedStrengthRecord, StrengthRecordRow } from "./types";
import type {
  WorkoutSessionExerciseRow,
  WorkoutSetRow,
} from "../workouts/types";

const EXERCISE_ROW = _exerciseRow({
  id: "session-exercise-id",
  exerciseId: "bench-press-id",
});
const PERFORMED_AT = "2026-09-01T17:00:00.000Z";

describe("prepareStrengthRecords", () => {
  it("prepares first-ever records with null previous ids", () => {
    const records = prepareStrengthRecords({
      exerciseRow: EXERCISE_ROW,
      setRows: [
        _setRow({ id: "set-1", weight: 100, reps: 5 }),
        _setRow({ id: "set-2", weight: 90, reps: 8 }),
      ],
      performedAt: PERFORMED_AT,
    });

    expect(records).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          workoutSessionExerciseId: "session-exercise-id",
          type: "highest_weight",
          value: 100,
          valueUnit: "lb",
          previousRecordId: null,
          performedAt: PERFORMED_AT,
        }),
        expect.objectContaining({
          type: "highest_volume",
          value: 1220,
          valueUnit: "lb_reps",
          previousRecordId: null,
        }),
        expect.objectContaining({
          type: "highest_estimated_one_rep_max",
          value: 116.67,
          previousRecordId: null,
        }),
      ]),
    );
  });

  it("uses the persisted previous row id when a record improves", () => {
    const previousHighestWeight = _persistedRecord({
      id: "previous-highest-weight-id",
      type: "highest_weight",
      value: 95,
    });

    const records = prepareStrengthRecords({
      exerciseRow: EXERCISE_ROW,
      setRows: [_setRow({ weight: 100, reps: 5 })],
      previousRecords: {
        highest_weight: previousHighestWeight,
      },
      performedAt: PERFORMED_AT,
    });

    expect(records).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: "highest_weight",
          previousRecordId: "previous-highest-weight-id",
        }),
      ]),
    );
  });

  it("does not prepare tied records", () => {
    const records = prepareStrengthRecords({
      exerciseRow: EXERCISE_ROW,
      setRows: [_setRow({ weight: 100, reps: 10 })],
      previousRecords: {
        highest_weight: _persistedRecord({
          type: "highest_weight",
          value: 100,
        }),
        highest_volume: _persistedRecord({
          type: "highest_volume",
          value: 1000,
          valueUnit: "lb_reps",
        }),
        highest_estimated_one_rep_max: _persistedRecord({
          type: "highest_estimated_one_rep_max",
          value: 133.33,
        }),
      },
      performedAt: PERFORMED_AT,
    });

    expect(records).toEqual([]);
  });

  it("uses only valid working sets", () => {
    const setRows = [
      _setRow({ id: "valid-working", weight: 100, reps: 5 }),
      _setRow({ id: "extra-working", position: 2, weight: 90, reps: 5 }),
      _setRow({
        id: "warmup",
        position: 3,
        kind: "warmup",
        weight: 500,
        reps: 10,
      }),
      _setRow({
        id: "backoff",
        position: 4,
        kind: "backoff",
        weight: 400,
        reps: 10,
      }),
      _setRow({
        id: "drop",
        position: 5,
        kind: "drop",
        weight: 300,
        reps: 10,
      }),
      _setRow({ id: "zero-reps", position: 6, weight: 250, reps: 0 }),
      _setRow({ id: "zero-weight", position: 7, weight: 0, reps: 8 }),
    ];

    expect(filterValidWorkingStrengthSetRows(setRows).map((row) => row.id)).toEqual(
      ["valid-working", "extra-working"],
    );

    expect(
      prepareStrengthRecords({
        exerciseRow: EXERCISE_ROW,
        setRows,
        performedAt: PERFORMED_AT,
      }),
    ).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ type: "highest_weight", value: 100 }),
        expect.objectContaining({ type: "highest_volume", value: 950 }),
      ]),
    );
  });
});

describe("mapStrengthRecordRowToPersistedStrengthRecord", () => {
  it("maps persisted identity and source context", () => {
    const record = mapStrengthRecordRowToPersistedStrengthRecord({
      ..._strengthRecordRow({
        id: "record-id",
        previousRecordId: "previous-record-id",
      }),
      source: {
        exercise_id: "bench-press-id",
        workout_session_id: "session-id",
      },
    });

    expect(record).toEqual({
      id: "record-id",
      userId: "user-id",
      type: "highest_weight",
      value: 100,
      valueUnit: "lb",
      exerciseId: "bench-press-id",
      workoutSessionId: "session-id",
      workoutSessionExerciseId: "session-exercise-id",
      previousRecordId: "previous-record-id",
      performedAt: "2026-09-01T17:00:00.000Z",
      createdAt: "2026-09-01T17:00:00.000Z",
    });
  });

  it("rejects rows without source context", () => {
    expect(() =>
      mapStrengthRecordRowToPersistedStrengthRecord({
        ..._strengthRecordRow({ previousRecordId: "previous-record-id" }),
        source: null,
      }),
    ).toThrow("Strength record row is missing source context.");
  });
});

describe("attachPreviousStrengthRecords", () => {
  it("joins previous records by their explicit ids", () => {
    const current = _persistedRecord({
      id: "current-record-id",
      value: 105,
      previousRecordId: "previous-record-id",
    });
    const previous = _persistedRecord({
      id: "previous-record-id",
      value: 100,
      workoutSessionId: "previous-session-id",
    });

    expect(attachPreviousStrengthRecords([current], [previous])).toEqual([
      {
        ...current,
        previousRecord: {
          type: "highest_weight",
          value: 100,
          valueUnit: "lb",
          exerciseId: "bench-press-id",
          workoutSessionId: "previous-session-id",
          performedAt: "2026-08-01T17:00:00.000Z",
        },
      },
    ]);
  });

  it("leaves a record intact when its previous row is unavailable", () => {
    const current = _persistedRecord({
      id: "current-record-id",
      previousRecordId: "missing-record-id",
    });

    expect(attachPreviousStrengthRecords([current], [])).toEqual([current]);
  });
});

describe("mapStrengthRecordRowsToLatestBaselines", () => {
  it("keeps the all-time maximum per exercise and type deterministically", () => {
    const baselines = mapStrengthRecordRowsToLatestBaselines([
      _rowWithSource({ id: "latest-lower", value: 95 }),
      _rowWithSource({
        id: "older-best",
        value: 100,
        performedAt: "2026-08-01T17:00:00.000Z",
        createdAt: "2026-08-01T17:00:00.000Z",
      }),
      _rowWithSource({
        id: "latest-best",
        value: 100,
        performedAt: "2026-09-01T17:00:00.000Z",
        createdAt: "2026-09-01T17:00:00.000Z",
      }),
      _rowWithSource({
        id: "squat-best",
        exerciseId: "squat-id",
        value: 300,
      }),
    ]);

    expect(baselines.get("bench-press-id")?.highest_weight?.id).toBe(
      "latest-best",
    );
    expect(baselines.get("squat-id")?.highest_weight?.id).toBe("squat-best");
  });
});

function _rowWithSource({
  exerciseId = "bench-press-id",
  ...overrides
}: Partial<Parameters<typeof _strengthRecordRow>[0]> & {
  exerciseId?: string;
}) {
  return {
    ..._strengthRecordRow(overrides),
    source: {
      exercise_id: exerciseId,
      workout_session_id: "session-id",
    },
  };
}

function _persistedRecord(
  overrides: Partial<PersistedStrengthRecord> = {},
): PersistedStrengthRecord {
  const type = overrides.type ?? "highest_weight";

  return {
    id: "previous-record-id",
    userId: "user-id",
    workoutSessionExerciseId: "previous-session-exercise-id",
    previousRecordId: null,
    createdAt: "2026-08-01T17:00:00.000Z",
    type,
    value: 100,
    valueUnit: type === "highest_volume" ? "lb_reps" : "lb",
    exerciseId: "bench-press-id",
    workoutSessionId: "previous-session-id",
    performedAt: "2026-08-01T17:00:00.000Z",
    ...overrides,
  };
}

function _exerciseRow({
  id,
  exerciseId,
}: {
  id: string;
  exerciseId: string;
}): WorkoutSessionExerciseRow {
  return {
    id,
    user_id: "user-id",
    workout_session_id: "session-id",
    exercise_id: exerciseId,
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
}

function _setRow({
  id = "set-id",
  workoutSessionExerciseId = "session-exercise-id",
  position = 1,
  kind = "working",
  weight = 100,
  reps = 10,
}: {
  id?: string;
  workoutSessionExerciseId?: string;
  position?: number;
  kind?: WorkoutSetRow["kind"];
  weight?: number;
  reps?: number;
}): WorkoutSetRow {
  return {
    id,
    user_id: "user-id",
    workout_session_exercise_id: workoutSessionExerciseId,
    position,
    kind,
    reps,
    weight_value: weight,
    weight_unit: "lb",
    normalized_weight_lbs: weight,
    rir: null,
    difficulty: null,
    pain: false,
    performed_at: "2026-09-01T16:05:00.000Z",
    created_at: "2026-09-01T16:05:00.000Z",
    updated_at: "2026-09-01T16:05:00.000Z",
  };
}

function _strengthRecordRow({
  id = "record-id",
  workoutSessionExerciseId = "session-exercise-id",
  previousRecordId = null,
  type = "highest_weight",
  value = 100,
  valueUnit,
  performedAt = "2026-09-01T17:00:00.000Z",
  createdAt = "2026-09-01T17:00:00.000Z",
}: {
  id?: string;
  workoutSessionExerciseId?: string;
  previousRecordId?: string | null;
  type?: StrengthRecordRow["record_type"];
  value?: number;
  valueUnit?: StrengthRecordRow["value_unit"];
  performedAt?: string;
  createdAt?: string;
} = {}): StrengthRecordRow {
  return {
    id,
    user_id: "user-id",
    workout_session_exercise_id: workoutSessionExerciseId,
    record_type: type,
    value,
    value_unit:
      valueUnit ?? (type === "highest_volume" ? "lb_reps" : "lb"),
    previous_record_id: previousRecordId,
    performed_at: performedAt,
    created_at: createdAt,
  };
}
