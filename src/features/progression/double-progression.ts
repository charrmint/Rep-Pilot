import { PerformedSet, ProgressionInput, ProgressionRecommendation } from "./types";

//TODO: add some description
export function recommendDoubleProgression(
    input: ProgressionInput,
): ProgressionRecommendation {
    const { config, currentWeight, performedSets } = input;
    const workingSets = performedSets.filter((set) => set.kind === "working");

    if (workingSets.some((set) => set.pain)) {
        return {
            action: "review",
            reason: "pain_recorded",
            recommendedWeight: currentWeight,
            //TODO: explanation texts should be transferred into a separate class/type
            explanation: "Review this exercise before progressing. You recorded pain during the session.",
        };
    }

    if (workingSets.length < config.targetSets) {
        return {
            action: "maintain",
            reason: "incomplete_target_sets",
            recommendedWeight: currentWeight,
            explanation: `Stay at ${currentWeight}. You completed ${workingSets.length} of ${config.targetSets} target working sets.`,
        };
    }

    const targetSets = workingSets.slice(0, config.targetSets);
    //TODO: rename these vars
    const allAtTop = targetSets.every((set) => set.reps >= config.maxReps);
    const allAtMinimum = targetSets.every((set) => set.reps >= config.minReps);
    const missedSetCount = targetSets.filter((set) => set.reps < config.minReps).length;

    if (allAtTop && _hasHighEffort(targetSets)) {
        return {
            action: "maintain",
            reason: "high_effort",
            recommendedWeight: currentWeight,
            explanation: `Stay at ${currentWeight}. You reached the top of the rep range, but the effort signals suggest repeating this weight first.`,
        };
    }

    //TODO: elif might work better here
    if (allAtTop) {
        const nextWeight = currentWeight + config.weightIncrement;

        return {
            action: "increase",
            reason: "top_of_rep_range",
            recommendedWeight: nextWeight,
            explanation: `Increase to ${nextWeight} next session. You completed all ${config.targetSets} working sets at the top of your ${config.minReps}-${config.maxReps} rep range.`
        };
    }

    if (allAtMinimum) {
        return {
            action: "maintain",
            reason: "within_rep_range",
            recommendedWeight: currentWeight,
            explanation: `Stay at ${currentWeight}. You completed all working sets within your ${config.minReps}-${config.maxReps} rep range.`
        }
    }

    if (missedSetCount === 1) {
        return {
            action: "maintain",
            reason: "single_set_below_range",
            recommendedWeight: currentWeight,
            explanation: `Stay at ${currentWeight}. Complete at least ${config.minReps} reps in every working set before increasing.`,
          };
    }

    if (missedSetCount > 1 && _hasRepeatedUnderperformance(input)) {
        const nextWeight = Math.max(0, currentWeight - config.weightIncrement);
    
        return {
          action: "reduce",
          reason: "repeated_underperformance",
          recommendedWeight: nextWeight,
          explanation: `Consider reducing to ${nextWeight}. Performance has declined across recent sessions.`,
        };
      }

    return {
        action: "maintain",
        reason: "default_maintain",
        recommendedWeight: currentWeight,
        explanation: `Stay at ${currentWeight}. Build consistency before changing the weight.`
    };
}

function _hasHighEffort(sets: PerformedSet[]): boolean {
    return sets.some((set) => set.rir === 0 || (set.difficulty ?? 0) >= 9);
}

function _hasRepeatedUnderperformance(input: ProgressionInput): boolean {
    const recentSessions = input.recentSessions ?? [];

    if (recentSessions.length < 2) {
        return false;
    }

    return recentSessions.slice(0, 2).every((session) => 
        session.workingSets.some((set) => set.reps < input.config.minReps)
    );
}

