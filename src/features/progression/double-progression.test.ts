import { recommendDoubleProgression } from "./double-progression";
import type {
  DoubleProgressionConfig,
  PerformedSet,
  ProgressionAction,
  ProgressionReason,
  RecentExerciseSession,
} from "./types";

const BASE_CONFIG: DoubleProgressionConfig = {
  targetSets: 3,
  minReps: 8,
  maxReps: 10,
  weightIncrement: 5,
};

function _workingSet(overrides: Partial<PerformedSet> = {}): PerformedSet {
  return {
    kind: "working",
    reps: 10,
    weight: 35,
    ...overrides,
  };
}

function _underperformingSession(
  weight = 35,
): RecentExerciseSession {
  return {
    targetSets: 3,
    minReps: 8,
    workingSets: [
      { reps: 8, weight },
      { reps: 7, weight },
      { reps: 6, weight },
    ],
  };
}

interface ProgressionCase {
  name: string;
  performedSets: PerformedSet[];
  expectedAction: ProgressionAction;
  expectedReason: ProgressionReason;
  expectedWeight: number | null;
  recentSessions?: RecentExerciseSession[];
}

describe("recommendDoubleProgression", () => {
  const cases: ProgressionCase[] = [
    {
      name: "returns review without a weight when a working set records pain",
      performedSets: [
        _workingSet({ pain: true }),
        _workingSet(),
        _workingSet(),
      ],
      expectedAction: "review",
      expectedReason: "pain_recorded",
      expectedWeight: null,
    },
    {
      name: "uses every mixed-weight set when estimating current capacity",
      performedSets: [
        _workingSet(),
        _workingSet({ weight: 30 }),
        _workingSet(),
      ],
      expectedAction: "maintain",
      expectedReason: "increment_exceeds_capacity",
      expectedWeight: 35,
    },
    {
      name: "does not review merely because every working set has a different weight",
      performedSets: [
        _workingSet({ weight: 30 }),
        _workingSet({ weight: 35 }),
        _workingSet({ weight: 40 }),
      ],
      expectedAction: "maintain",
      expectedReason: "increment_exceeds_capacity",
      expectedWeight: 40,
    },
    {
      name: "maintains the actual working weight when target sets are incomplete",
      performedSets: [
        _workingSet({ weight: 40 }),
        _workingSet({ weight: 40 }),
        { kind: "warmup", reps: 12, weight: 15 },
      ],
      expectedAction: "maintain",
      expectedReason: "incomplete_target_sets",
      expectedWeight: 40,
    },
    {
      name: "increases from the actual weight when all target sets reach the top",
      performedSets: [
        _workingSet({ weight: 100 }),
        _workingSet({ weight: 100 }),
        _workingSet({ weight: 100 }),
      ],
      expectedAction: "increase",
      expectedReason: "top_of_rep_range",
      expectedWeight: 105,
    },
    {
      name: "maintains after top-of-range sets when effort is too high",
      performedSets: [
        _workingSet({ rir: 0 }),
        _workingSet(),
        _workingSet(),
      ],
      expectedAction: "maintain",
      expectedReason: "high_effort",
      expectedWeight: 35,
    },
    {
      name: "maintains when every target set is inside the range",
      performedSets: [
        _workingSet({ reps: 10 }),
        _workingSet({ reps: 9 }),
        _workingSet({ reps: 8 }),
      ],
      expectedAction: "maintain",
      expectedReason: "within_rep_range",
      expectedWeight: 35,
    },
    {
      name: "maintains when exactly one target set is below range",
      performedSets: [
        _workingSet({ reps: 10 }),
        _workingSet({ reps: 8 }),
        _workingSet({ reps: 7 }),
      ],
      expectedAction: "maintain",
      expectedReason: "single_set_below_range",
      expectedWeight: 35,
    },
    {
      name: "reduces after two comparable sessions of repeated underperformance",
      performedSets: [
        _workingSet({ reps: 8 }),
        _workingSet({ reps: 7 }),
        _workingSet({ reps: 6 }),
      ],
      recentSessions: [
        _underperformingSession(),
        _underperformingSession(),
      ],
      expectedAction: "reduce",
      expectedReason: "repeated_underperformance",
      expectedWeight: 30,
    },
    {
      name: "does not reduce when recent sessions used a different weight",
      performedSets: [
        _workingSet({ reps: 8 }),
        _workingSet({ reps: 7 }),
        _workingSet({ reps: 6 }),
      ],
      recentSessions: [
        _underperformingSession(30),
        _underperformingSession(30),
      ],
      expectedAction: "maintain",
      expectedReason: "default_maintain",
      expectedWeight: 35,
    },
    {
      name: "ignores non-working and extra sets when deciding progression",
      performedSets: [
        { kind: "warmup", reps: 5, weight: 10 },
        _workingSet({ weight: 100 }),
        _workingSet({ weight: 100 }),
        _workingSet({ weight: 100 }),
        _workingSet({ reps: 4, weight: 20 }),
        { kind: "drop", reps: 4, weight: 20 },
      ],
      expectedAction: "increase",
      expectedReason: "top_of_rep_range",
      expectedWeight: 105,
    },
  ];

  it.each(cases)(
    "$name",
    ({
      performedSets,
      recentSessions,
      expectedAction,
      expectedReason,
      expectedWeight,
    }) => {
      const recommendation = recommendDoubleProgression({
        config: BASE_CONFIG,
        performedSets,
        recentSessions,
      });

      expect(recommendation.action).toBe(expectedAction);
      expect(recommendation.reason).toBe(expectedReason);
      expect(recommendation.recommendedWeight).toBe(expectedWeight);
      expect(recommendation.explanation).not.toHaveLength(0);
      expect(recommendation.explanation).not.toMatch(/Stay at|Increase to/);

      if (expectedAction === "review") {
        expect(recommendation.recommendedMinReps).toBeNull();
        expect(recommendation.recommendedMaxReps).toBeNull();
        expect(recommendation.recommendedRir).toBeNull();
      } else {
        expect(recommendation.recommendedMinReps).toBe(BASE_CONFIG.minReps);
        expect(recommendation.recommendedMaxReps).toBeLessThanOrEqual(
          BASE_CONFIG.maxReps,
        );
        expect(recommendation.recommendedRir).toBe(2);
      }
    },
  );

  it("handles a ramping bench performance without treating mixed weights as ambiguous", () => {
    const recommendation = recommendDoubleProgression({
      config: { ...BASE_CONFIG, maxReps: 12 },
      performedSets: [
        _workingSet({ reps: 12, weight: 90 }),
        _workingSet({ reps: 10, weight: 100 }),
        _workingSet({ reps: 9, weight: 100 }),
      ],
    });

    expect(recommendation).toMatchObject({
      action: "maintain",
      reason: "within_rep_range",
      recommendedWeight: 100,
      recommendedMinReps: 8,
      recommendedMaxReps: 12,
      recommendedRir: 2,
    });
  });

  it("keeps a mixed-load session at its highest successful weight", () => {
    const recommendation = recommendDoubleProgression({
      config: BASE_CONFIG,
      performedSets: [
        _workingSet({ reps: 10, weight: 90, rir: 3 }),
        _workingSet({ reps: 10, weight: 100, rir: 2 }),
        _workingSet({ reps: 7, weight: 110, rir: 0 }),
      ],
    });

    expect(recommendation).toMatchObject({
      action: "maintain",
      reason: "single_set_below_range",
      recommendedWeight: 100,
      recommendedMinReps: 8,
      recommendedMaxReps: 10,
      recommendedRir: 2,
    });
  });

  it("uses RIR-adjusted capacity to lower the rep target after increasing", () => {
    const recommendation = recommendDoubleProgression({
      config: { ...BASE_CONFIG, maxReps: 12 },
      performedSets: [
        _workingSet({ reps: 12, weight: 100, rir: 3 }),
        _workingSet({ reps: 12, weight: 100, rir: 2 }),
        _workingSet({ reps: 12, weight: 100, rir: 1 }),
      ],
    });

    expect(recommendation).toMatchObject({
      action: "increase",
      recommendedWeight: 105,
      recommendedMinReps: 9,
      recommendedMaxReps: 11,
      recommendedRir: 2,
    });
  });

  it("uses recorded RIR to support an increment before every set reaches the top", () => {
    const recommendation = recommendDoubleProgression({
      config: { ...BASE_CONFIG, maxReps: 12 },
      performedSets: [
        _workingSet({ reps: 10, weight: 100, rir: 3 }),
        _workingSet({ reps: 10, weight: 100, rir: 3 }),
        _workingSet({ reps: 10, weight: 100, rir: 3 }),
      ],
    });

    expect(recommendation).toMatchObject({
      action: "increase",
      reason: "capacity_supports_increase",
      recommendedWeight: 105,
      recommendedMinReps: 8,
      recommendedMaxReps: 10,
      recommendedRir: 2,
    });
  });

  it("uses the final set as a fatigue guard even when average capacity looks sufficient", () => {
    const recommendation = recommendDoubleProgression({
      config: { ...BASE_CONFIG, maxReps: 12 },
      performedSets: [
        _workingSet({ reps: 12, weight: 100, rir: 3 }),
        _workingSet({ reps: 12, weight: 100, rir: 3 }),
        _workingSet({ reps: 8, weight: 100, rir: 0 }),
      ],
    });

    expect(recommendation).toMatchObject({
      action: "maintain",
      recommendedWeight: 100,
    });
    expect(recommendation.reason).not.toBe("capacity_supports_increase");
  });

  it("keeps the current load when its configured increment is too large", () => {
    const recommendation = recommendDoubleProgression({
      config: BASE_CONFIG,
      performedSets: [
        _workingSet({ weight: 40 }),
        _workingSet({ weight: 40 }),
        _workingSet({ weight: 40 }),
      ],
    });

    expect(recommendation).toMatchObject({
      action: "maintain",
      reason: "increment_exceeds_capacity",
      recommendedWeight: 40,
    });
  });

  it("uses the lower half of the configured range when RIR is unavailable", () => {
    const recommendation = recommendDoubleProgression({
      config: { ...BASE_CONFIG, maxReps: 12 },
      performedSets: [
        _workingSet({ reps: 12, weight: 100 }),
        _workingSet({ reps: 12, weight: 100 }),
        _workingSet({ reps: 12, weight: 100 }),
      ],
    });

    expect(recommendation).toMatchObject({
      action: "increase",
      recommendedWeight: 105,
      recommendedMinReps: 8,
      recommendedMaxReps: 10,
      recommendedRir: 2,
    });
  });

  it("does not reduce below zero", () => {
    const recommendation = recommendDoubleProgression({
      config: BASE_CONFIG,
      performedSets: [
        _workingSet({ reps: 7, weight: 2.5 }),
        _workingSet({ reps: 6, weight: 2.5 }),
        _workingSet({ reps: 5, weight: 2.5 }),
      ],
      recentSessions: [
        _underperformingSession(2.5),
        _underperformingSession(2.5),
      ],
    });

    expect(recommendation.action).toBe("reduce");
    expect(recommendation.recommendedWeight).toBe(0);
  });

  it("rounds the recommended weight to storage precision", () => {
    const recommendation = recommendDoubleProgression({
      config: {
        ...BASE_CONFIG,
        weightIncrement: 0.2,
      },
      performedSets: [
        _workingSet({ weight: 35.1 }),
        _workingSet({ weight: 35.1 }),
        _workingSet({ weight: 35.1 }),
      ],
    });

    expect(recommendation.recommendedWeight).toBe(35.3);
  });

  it("rejects an input without working sets", () => {
    expect(() =>
      recommendDoubleProgression({
        config: BASE_CONFIG,
        performedSets: [{ kind: "warmup", reps: 10, weight: 20 }],
      }),
    ).toThrow("At least one working set is required.");
  });
});
