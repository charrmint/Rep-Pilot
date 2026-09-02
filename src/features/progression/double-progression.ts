import type {
  DoubleProgressionConfig,
  PerformedSet,
  ProgressionInput,
  ProgressionRecommendation,
  ProgressionReason,
  RecentExerciseSession,
} from "./types";

const WEIGHT_DECIMAL_PLACES = 2;
const DEFAULT_TARGET_RIR = 2;
const REP_PREDICTION_MARGIN = 1;
const EPLEY_REP_FACTOR = 30;

export function recommendDoubleProgression(
  input: ProgressionInput,
): ProgressionRecommendation {
  const { config, performedSets } = input;
  const workingSets = performedSets.filter((set) => set.kind === "working");

  if (workingSets.length === 0) {
    throw new Error("At least one working set is required.");
  }

  if (workingSets.some((set) => set.pain)) {
    return _reviewRecommendation(
      "pain_recorded",
      "Review this exercise before progressing because pain was recorded.",
    );
  }

  const evaluatedSets = workingSets.slice(0, config.targetSets);
  const benchmarkWeight = _getBenchmarkWeight(evaluatedSets, config.minReps);

  if (evaluatedSets.length < config.targetSets) {
    return _prescribedRecommendation({
      action: "maintain",
      reason: "incomplete_target_sets",
      recommendedWeight: benchmarkWeight,
      recommendedRepRange: _configuredRepRange(config),
      explanation: `You completed ${evaluatedSets.length} of ${config.targetSets} target working sets.`,
    });
  }

  const currentPredictions = _predictSetRepsAtWeight(
    evaluatedSets,
    benchmarkWeight,
  );
  const allActualSetsAtTop = evaluatedSets.every(
    (set) => set.reps >= config.maxReps,
  );
  const hasRecordedRir = evaluatedSets.some((set) => set.rir !== undefined);
  const increasedWeight = _roundWeight(
    benchmarkWeight + config.weightIncrement,
  );
  const increasedPredictions = _predictSetRepsAtWeight(
    evaluatedSets,
    increasedWeight,
  );
  const supportsIncrease = _isSustainableAcrossSets(
    increasedPredictions,
    config.minReps,
  );

  if (allActualSetsAtTop && _hasHighEffort(evaluatedSets)) {
    return _prescribedRecommendation({
      action: "maintain",
      reason: "high_effort",
      recommendedWeight: benchmarkWeight,
      recommendedRepRange: _getRecommendedRepRange({
        predictions: currentPredictions,
        config,
        hasRecordedRir,
        action: "maintain",
      }),
      explanation:
        "You reached the top of the rep range, but the effort signals suggest repeating this weight first.",
    });
  }

  if (supportsIncrease && (allActualSetsAtTop || hasRecordedRir)) {
    return _prescribedRecommendation({
      action: "increase",
      reason: allActualSetsAtTop
        ? "top_of_rep_range"
        : "capacity_supports_increase",
      recommendedWeight: increasedWeight,
      recommendedRepRange: _getRecommendedRepRange({
        predictions: increasedPredictions,
        config,
        hasRecordedRir,
        action: "increase",
      }),
      explanation: allActualSetsAtTop
        ? `You completed all ${config.targetSets} working sets at the top of your ${config.minReps}-${config.maxReps} rep range, and the next increment is projected to remain in range.`
        : "Your set-by-set weight, reps, and RIR support one load increment while keeping the projected reps in range.",
    });
  }

  if (allActualSetsAtTop && !supportsIncrease) {
    return _prescribedRecommendation({
      action: "maintain",
      reason: "increment_exceeds_capacity",
      recommendedWeight: benchmarkWeight,
      recommendedRepRange: _getRecommendedRepRange({
        predictions: currentPredictions,
        config,
        hasRecordedRir,
        action: "maintain",
      }),
      explanation:
        "You reached the top of the rep range, but the configured weight increment is projected to take you below the minimum rep target.",
    });
  }

  const missedSetCount = currentPredictions.filter(
    (reps) => reps < config.minReps,
  ).length;
  const maintainRepRange = _getRecommendedRepRange({
    predictions: currentPredictions,
    config,
    hasRecordedRir,
    action: "maintain",
  });

  if (missedSetCount === 0) {
    return _prescribedRecommendation({
      action: "maintain",
      reason: "within_rep_range",
      recommendedWeight: benchmarkWeight,
      recommendedRepRange: maintainRepRange,
      explanation:
        "Your set-by-set capacity remains within the configured rep range.",
    });
  }

  if (missedSetCount === 1) {
    return _prescribedRecommendation({
      action: "maintain",
      reason: "single_set_below_range",
      recommendedWeight: benchmarkWeight,
      recommendedRepRange: maintainRepRange,
      explanation: `Complete at least ${config.minReps} projected reps across every target working set before increasing.`,
    });
  }

  if (_hasRepeatedUnderperformance(input, benchmarkWeight)) {
    const reducedWeight = _roundWeight(
      Math.max(0, benchmarkWeight - config.weightIncrement),
    );

    return _prescribedRecommendation({
      action: "reduce",
      reason: "repeated_underperformance",
      recommendedWeight: reducedWeight,
      recommendedRepRange: _getRecommendedRepRange({
        predictions: _predictSetRepsAtWeight(evaluatedSets, reducedWeight),
        config,
        hasRecordedRir,
        action: "reduce",
      }),
      explanation:
        "Set-by-set capacity has remained below the minimum target across three sessions at this weight.",
    });
  }

  return _prescribedRecommendation({
    action: "maintain",
    reason: "default_maintain",
    recommendedWeight: benchmarkWeight,
    recommendedRepRange: maintainRepRange,
    explanation: "Build consistency at this weight before changing it.",
  });
}

function _reviewRecommendation(
  reason: ProgressionReason,
  explanation: string,
): ProgressionRecommendation {
  return {
    action: "review",
    reason,
    recommendedWeight: null,
    recommendedMinReps: null,
    recommendedMaxReps: null,
    recommendedRir: null,
    explanation,
  };
}

function _prescribedRecommendation({
  action,
  reason,
  recommendedWeight,
  recommendedRepRange,
  explanation,
}: Pick<ProgressionRecommendation, "action" | "reason" | "explanation"> & {
  recommendedWeight: number;
  recommendedRepRange: {
    recommendedMinReps: number;
    recommendedMaxReps: number;
  };
}): ProgressionRecommendation {
  return {
    action,
    reason,
    recommendedWeight,
    ...recommendedRepRange,
    recommendedRir: DEFAULT_TARGET_RIR,
    explanation,
  };
}

function _getBenchmarkWeight(
  sets: Array<{ reps: number; weight: number }>,
  minReps: number,
): number {
  const successfulWeights = sets
    .filter((set) => set.reps >= minReps)
    .map((set) => set.weight);
  const candidateWeights =
    successfulWeights.length > 0
      ? successfulWeights
      : sets.map((set) => set.weight);

  return Math.max(...candidateWeights);
}

function _predictSetRepsAtWeight(
  sets: Array<{ reps: number; weight: number; rir?: number }>,
  candidateWeight: number,
): number[] {
  if (candidateWeight === 0) {
    return sets.map((set) => set.reps);
  }

  return sets.map((set) => {
    const recordedRir = set.rir ?? 0;
    const prescriptionRir = set.rir === undefined ? 0 : DEFAULT_TARGET_RIR;
    const estimatedOneRepMax =
      set.weight *
      (1 + (set.reps + recordedRir) / EPLEY_REP_FACTOR);
    const predictedFailureReps =
      EPLEY_REP_FACTOR * (estimatedOneRepMax / candidateWeight - 1);

    return Math.max(0, Math.round(predictedFailureReps - prescriptionRir));
  });
}

function _isSustainableAcrossSets(
  predictedReps: number[],
  minReps: number,
): boolean {
  const averageReps = _getAverage(predictedReps);
  const finalSetReps = predictedReps.at(-1);

  return (
    averageReps !== null &&
    finalSetReps !== undefined &&
    averageReps >= minReps &&
    finalSetReps >= minReps
  );
}

function _getRecommendedRepRange({
  predictions,
  config,
  hasRecordedRir,
  action,
}: {
  predictions: number[];
  config: DoubleProgressionConfig;
  hasRecordedRir: boolean;
  action: ProgressionRecommendation["action"];
}): {
  recommendedMinReps: number;
  recommendedMaxReps: number;
} {
  if (!hasRecordedRir) {
    return action === "increase"
      ? {
          recommendedMinReps: config.minReps,
          recommendedMaxReps: Math.floor(
            (config.minReps + config.maxReps) / 2,
          ),
        }
      : _configuredRepRange(config);
  }

  const averagePrediction = _getAverage(predictions);
  const centerReps = Math.round(averagePrediction ?? config.minReps);

  return {
    recommendedMinReps: _clampRepTarget(
      centerReps - REP_PREDICTION_MARGIN,
      config,
    ),
    recommendedMaxReps: _clampRepTarget(
      centerReps + REP_PREDICTION_MARGIN,
      config,
    ),
  };
}

function _getAverage(values: number[]): number | null {
  if (values.length === 0) {
    return null;
  }

  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function _configuredRepRange(config: DoubleProgressionConfig): {
  recommendedMinReps: number;
  recommendedMaxReps: number;
} {
  return {
    recommendedMinReps: config.minReps,
    recommendedMaxReps: config.maxReps,
  };
}

function _clampRepTarget(
  reps: number,
  config: DoubleProgressionConfig,
): number {
  return Math.min(config.maxReps, Math.max(config.minReps, reps));
}

function _hasHighEffort(sets: PerformedSet[]): boolean {
  return sets.some((set) => set.rir === 0 || (set.difficulty ?? 0) >= 9);
}

function _hasRepeatedUnderperformance(
  input: ProgressionInput,
  benchmarkWeight: number,
): boolean {
  const recentSessions = input.recentSessions ?? [];

  if (recentSessions.length < 2) {
    return false;
  }

  return recentSessions
    .slice(0, 2)
    .every((session) =>
      _isComparableUnderperformingSession(session, benchmarkWeight),
    );
}

function _isComparableUnderperformingSession(
  session: RecentExerciseSession,
  benchmarkWeight: number,
): boolean {
  const evaluatedSets = session.workingSets.slice(0, session.targetSets);

  if (evaluatedSets.length < session.targetSets) {
    return false;
  }

  const sessionBenchmark = _getBenchmarkWeight(
    evaluatedSets,
    session.minReps,
  );

  if (sessionBenchmark !== benchmarkWeight) {
    return false;
  }

  return (
    _predictSetRepsAtWeight(evaluatedSets, benchmarkWeight).filter(
      (reps) => reps < session.minReps,
    ).length > 1
  );
}

function _roundWeight(value: number): number {
  return Number(value.toFixed(WEIGHT_DECIMAL_PLACES));
}
