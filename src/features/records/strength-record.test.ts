import { detectStrengthRecords } from "./strength-record";
import type { StrengthRecord } from "./types";

const baseInput = {
  exerciseId: "exercise-1",
  workoutSessionId: "session-1",
  performedAt: "2026-08-03T18:30:00.000Z",
};

function previousRecord(
  overrides: Partial<StrengthRecord> = {},
): StrengthRecord {
  const type = overrides.type ?? "highest_weight";

  return {
    type,
    value: 100,
    valueUnit: type === "highest_volume" ? "lb_reps" : "lb",
    exerciseId: "exercise-1",
    workoutSessionId: "previous-session",
    performedAt: "2026-07-27T18:30:00.000Z",
    ...overrides,
  };
}

describe("detectStrengthRecords", () => {
  it("returns no records when there are no sets", () => {
    expect(
      detectStrengthRecords({
        ...baseInput,
        sets: [],
      }),
    ).toEqual([]);
  });

  it("detects first strength records when no previous records exist", () => {
    const records = detectStrengthRecords({
      ...baseInput,
      sets: [
        { weight: 100, reps: 5 },
        { weight: 90, reps: 8 },
        { weight: 80, reps: 10 },
      ],
    });

    expect(records).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: "highest_weight",
          value: 100,
          valueUnit: "lb",
          exerciseId: baseInput.exerciseId,
          workoutSessionId: baseInput.workoutSessionId,
          performedAt: baseInput.performedAt,
          previousRecord: undefined,
        }),
        expect.objectContaining({
          type: "highest_volume",
          value: 2020,
          valueUnit: "lb_reps",
          exerciseId: baseInput.exerciseId,
          workoutSessionId: baseInput.workoutSessionId,
          performedAt: baseInput.performedAt,
          previousRecord: undefined,
        }),
        expect.objectContaining({
          type: "highest_estimated_one_rep_max",
          value: 116.67,
          valueUnit: "lb",
          exerciseId: baseInput.exerciseId,
          workoutSessionId: baseInput.workoutSessionId,
          performedAt: baseInput.performedAt,
          previousRecord: undefined,
        }),
      ]),
    );
    expect(records).toHaveLength(3);
  });

  it("returns only records that beat previous records", () => {
    const previousHighestWeight = previousRecord({
      type: "highest_weight",
      value: 105,
    });
    const previousHighestEstimatedOneRepMax = previousRecord({
      type: "highest_estimated_one_rep_max",
      value: 130,
    });
    const previousHighestVolume = previousRecord({
      type: "highest_volume",
      value: 1500,
    });

    const records = detectStrengthRecords({
      ...baseInput,
      sets: [
        { weight: 100, reps: 8 },
        { weight: 90, reps: 8 },
      ],
      previousRecords: {
        highest_weight: previousHighestWeight,
        highest_estimated_one_rep_max: previousHighestEstimatedOneRepMax,
        highest_volume: previousHighestVolume,
      },
    });

    expect(records).toEqual([
      expect.objectContaining({
        type: "highest_volume",
        value: 1520,
        previousRecord: previousHighestVolume,
      }),
    ]);
  });

  it("does not count ties as new records", () => {
    const records = detectStrengthRecords({
      ...baseInput,
      sets: [{ weight: 100, reps: 10 }],
      previousRecords: {
        highest_weight: previousRecord({
          type: "highest_weight",
          value: 100,
        }),
        highest_estimated_one_rep_max: previousRecord({
          type: "highest_estimated_one_rep_max",
          value: 133.33333333333331,
        }),
        highest_volume: previousRecord({
          type: "highest_volume",
          value: 1000,
        }),
      },
    });

    expect(records).toEqual([]);
  });

  it("rounds record values to two decimals before comparing and returning", () => {
    const records = detectStrengthRecords({
      ...baseInput,
      sets: [{ weight: 100, reps: 10 }],
      previousRecords: {
        highest_estimated_one_rep_max: previousRecord({
          type: "highest_estimated_one_rep_max",
          value: 133.33,
        }),
      },
    });

    expect(records).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: "highest_estimated_one_rep_max",
        }),
      ]),
    );
  });

  it("skips estimated one-rep max records when all sets are above the rep threshold", () => {
    const records = detectStrengthRecords({
      ...baseInput,
      sets: [
        { weight: 50, reps: 13 },
        { weight: 45, reps: 15 },
      ],
    });

    expect(records.map((record) => record.type)).toEqual(
      expect.arrayContaining(["highest_weight", "highest_volume"]),
    );
    expect(records).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: "highest_estimated_one_rep_max",
        }),
      ]),
    );
  });

  it("uses one-rep set weight exactly for estimated one-rep max records", () => {
    const records = detectStrengthRecords({
      ...baseInput,
      sets: [{ weight: 225, reps: 1 }],
    });

    expect(records).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: "highest_estimated_one_rep_max",
          value: 225,
        }),
      ]),
    );
  });

  it("supports partial previous-record baselines", () => {
    const previousHighestWeight = previousRecord({
      type: "highest_weight",
      value: 200,
    });

    const records = detectStrengthRecords({
      ...baseInput,
      sets: [{ weight: 100, reps: 5 }],
      previousRecords: {
        highest_weight: previousHighestWeight,
      },
    });

    expect(records).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: "highest_volume",
          previousRecord: undefined,
        }),
        expect.objectContaining({
          type: "highest_estimated_one_rep_max",
          previousRecord: undefined,
        }),
      ]),
    );
    expect(records).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({ type: "highest_weight" }),
      ]),
    );
  });

  it("ignores invalid zero, negative, non-finite, and fractional sets", () => {
    const records = detectStrengthRecords({
      ...baseInput,
      sets: [
        { weight: 200, reps: 0 },
        { weight: -300, reps: 5 },
        { weight: Number.POSITIVE_INFINITY, reps: 5 },
        { weight: Number.NaN, reps: 5 },
        { weight: 100, reps: 8.5 },
        { weight: 90, reps: Number.NaN },
        { weight: 100, reps: 5 },
      ],
    });

    expect(records).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: "highest_weight",
          value: 100,
        }),
        expect.objectContaining({
          type: "highest_volume",
          value: 500,
        }),
        expect.objectContaining({
          type: "highest_estimated_one_rep_max",
          value: 116.67,
        }),
      ]),
    );
    expect(records).toHaveLength(3);
  });

  it("returns no records when every set is invalid or unperformed", () => {
    expect(
      detectStrengthRecords({
        ...baseInput,
        sets: [
          { weight: 0, reps: 0 },
          { weight: 100, reps: 0 },
          { weight: 0, reps: 8 },
          { weight: Number.NaN, reps: 8 },
        ],
      }),
    ).toEqual([]);
  });

  it("detects multiple records from the same exercise performance", () => {
    const records = detectStrengthRecords({
      ...baseInput,
      sets: [
        { weight: 110, reps: 5 },
        { weight: 105, reps: 5 },
      ],
      previousRecords: {
        highest_weight: previousRecord({
          type: "highest_weight",
          value: 100,
        }),
        highest_estimated_one_rep_max: previousRecord({
          type: "highest_estimated_one_rep_max",
          value: 120,
        }),
        highest_volume: previousRecord({
          type: "highest_volume",
          value: 1000,
          valueUnit: "lb_reps",
        }),
      },
    });

    expect(records).toEqual([
      expect.objectContaining({
        type: "highest_weight",
        value: 110,
      }),
      expect.objectContaining({
        type: "highest_volume",
        value: 1075,
      }),
      expect.objectContaining({
        type: "highest_estimated_one_rep_max",
        value: 128.33,
      }),
    ]);
  });
});
