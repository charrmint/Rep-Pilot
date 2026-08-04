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
  return {
    type: "highest_weight",
    value: 100,
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
          exerciseId: baseInput.exerciseId,
          workoutSessionId: baseInput.workoutSessionId,
          performedAt: baseInput.performedAt,
          previousRecord: undefined,
        }),
        expect.objectContaining({
          type: "highest_volume",
          value: 2020,
          exerciseId: baseInput.exerciseId,
          workoutSessionId: baseInput.workoutSessionId,
          performedAt: baseInput.performedAt,
          previousRecord: undefined,
        }),
        expect.objectContaining({
          type: "highest_estimated_one_rep_max",
          value: expect.closeTo(116.667, 3),
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
});
