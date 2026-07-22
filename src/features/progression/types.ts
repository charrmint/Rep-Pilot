export type ProgressionAction = 
    | "increase"
    | "maintain"
    | "reduce"
    | "review";

export type ProgressionReason =
    | "pain_recorded"
    | "incomplete_target_sets"
    | "top_of_rep_range"
    | "within_rep_range"
    | "single_set_below_range"
    | "repeated_underperformance"
    | "default_maintain"
    | "high_effort";

export type SetKind =
    | "warmup"
    | "working"
    | "backoff"
    | "drop";

export interface PerformedSet {
    kind: SetKind;
    reps: number;
    weight: number;
    rir?: number;
    difficulty?: number;
    pain?: boolean;
}

export interface DoubleProgressionConfig {
    targetSets: number;
    minReps: number;
    maxReps: number;
    weightIncrement: number;
}

export interface RecentExerciseSession {
    workingSets: Array<{
        reps: number;
        weight: number;
    }>
}

export interface ProgressionInput {
    config: DoubleProgressionConfig;
    currentWeight: number;
    performedSets: PerformedSet[];
    recentSessions?: RecentExerciseSession[];
}

export interface ProgressionRecommendation {
    action: ProgressionAction;
    reason: ProgressionReason;
    recommendedWeight: number;
    explanation: string;
}
