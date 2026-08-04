import { recommendDoubleProgression } from "./double-progression";
import type {
  DoubleProgressionConfig,
  PerformedSet,
  ProgressionAction,
  ProgressionReason,
} from "./types";

const baseConfig: DoubleProgressionConfig = {
  targetSets: 3,
  minReps: 8,
  maxReps: 10,
  weightIncrement: 5,
};

function workingSet(overrides: Partial<PerformedSet> = {}): PerformedSet {
  return {
    kind: "working",
    reps: 10,
    weight: 35,
    ...overrides,
  };
}

interface ProgressionCase {
  name: string;
  performedSets: PerformedSet[];
  expectedAction: ProgressionAction;
  expectedReason: ProgressionReason;
  expectedWeight: number;
  recentSessions?: Array<{
    workingSets: Array<{
      reps: number;
      weight: number;
    }>;
  }>;
}

describe("recommendDoubleProgression", () => {
  const cases: ProgressionCase[] = [
    {
      name: "returns review when a working set records pain",
      performedSets: [
        workingSet({ pain: true }),
        workingSet(),
        workingSet(),
      ],
      expectedAction: "review",
      expectedReason: "pain_recorded",
      expectedWeight: 35,
    },
    {
      name: "maintains when fewer than the target working sets are completed",
      performedSets: [
        workingSet(),
        workingSet(),
        { kind: "warmup", reps: 12, weight: 15 },
      ],
      expectedAction: "maintain",
      expectedReason: "incomplete_target_sets",
      expectedWeight: 35,
    },
    {
      name: "increases when all target working sets reach the top of the range",
      performedSets: [workingSet(), workingSet(), workingSet()],
      expectedAction: "increase",
      expectedReason: "top_of_rep_range",
      expectedWeight: 40,
    },
    {
      name: "maintains after top-of-range sets when effort is too high",
      performedSets: [
        workingSet({ rir: 0 }),
        workingSet(),
        workingSet(),
      ],
      expectedAction: "maintain",
      expectedReason: "high_effort",
      expectedWeight: 35,
    },
    {
      name: "maintains when all target working sets are inside range but not at the top",
      performedSets: [
        workingSet({ reps: 10 }),
        workingSet({ reps: 9 }),
        workingSet({ reps: 8 }),
      ],
      expectedAction: "maintain",
      expectedReason: "within_rep_range",
      expectedWeight: 35,
    },
    {
      name: "maintains when exactly one target working set is below range",
      performedSets: [
        workingSet({ reps: 10 }),
        workingSet({ reps: 8 }),
        workingSet({ reps: 7 }),
      ],
      expectedAction: "maintain",
      expectedReason: "single_set_below_range",
      expectedWeight: 35,
    },
    {
      name: "reduces when multiple target working sets are below range after recent underperformance",
      performedSets: [
        workingSet({ reps: 8 }),
        workingSet({ reps: 7 }),
        workingSet({ reps: 6 }),
      ],
      recentSessions: [
        { workingSets: [{ reps: 7, weight: 35 }] },
        { workingSets: [{ reps: 6, weight: 35 }] },
      ],
      expectedAction: "reduce",
      expectedReason: "repeated_underperformance",
      expectedWeight: 30,
    },
    {
      name: "maintains by default when multiple sets are below range without repeated underperformance",
      performedSets: [
        workingSet({ reps: 8 }),
        workingSet({ reps: 7 }),
        workingSet({ reps: 6 }),
      ],
      expectedAction: "maintain",
      expectedReason: "default_maintain",
      expectedWeight: 35,
    },
    {
      name: "ignores non-working sets when deciding progression",
      performedSets: [
        { kind: "warmup", reps: 5, weight: 10 },
        workingSet(),
        workingSet(),
        workingSet(),
        { kind: "drop", reps: 4, weight: 20 },
      ],
      expectedAction: "increase",
      expectedReason: "top_of_rep_range",
      expectedWeight: 40,
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
        config: baseConfig,
        currentWeight: 35,
        performedSets,
        recentSessions,
      });

      expect(recommendation.action).toBe(expectedAction);
      expect(recommendation.reason).toBe(expectedReason);
      expect(recommendation.recommendedWeight).toBe(expectedWeight);
      expect(recommendation.explanation).not.toHaveLength(0);
    },
  );

  it("does not reduce below zero", () => {
    const recommendation = recommendDoubleProgression({
      config: {
        ...baseConfig,
        weightIncrement: 5,
      },
      currentWeight: 2.5,
      performedSets: [
        workingSet({ reps: 7, weight: 2.5 }),
        workingSet({ reps: 6, weight: 2.5 }),
        workingSet({ reps: 5, weight: 2.5 }),
      ],
      recentSessions: [
        { workingSets: [{ reps: 7, weight: 2.5 }] },
        { workingSets: [{ reps: 6, weight: 2.5 }] },
      ],
    });

    expect(recommendation.action).toBe("reduce");
    expect(recommendation.reason).toBe("repeated_underperformance");
    expect(recommendation.recommendedWeight).toBe(0);
  });
});
