import type { Enums, Json, Tables } from "@/lib/supabase/database.types";

import type {
  WorkoutSessionExerciseRow,
  WorkoutSessionRow,
  WorkoutSetRow,
} from "../workouts/types";

export type ProgressionAction = Enums<"progression_action">;
export type ProgressionReason = Enums<"progression_reason">;
export type SetKind = Enums<"set_kind">;

export type ProgressionRecommendationRow =
  Tables<"progression_recommendations">;

export type RecentProgressionExerciseRow = Pick<
  WorkoutSessionExerciseRow,
  | "exercise_id"
  | "id"
  | "min_reps"
  | "target_sets"
  | "workout_session_id"
> & {
  workoutSession: Pick<WorkoutSessionRow, "started_at">;
  sets: WorkoutSetRow[];
};

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
  targetSets: number;
  minReps: number;
  workingSets: Array<{
    reps: number;
    weight: number;
    rir?: number;
  }>;
}

export interface ProgressionInput {
  config: DoubleProgressionConfig;
  performedSets: PerformedSet[];
  recentSessions?: RecentExerciseSession[];
}

export interface ProgressionRecommendation {
  action: ProgressionAction;
  reason: ProgressionReason;
  recommendedWeight: number | null;
  recommendedMinReps: number | null;
  recommendedMaxReps: number | null;
  recommendedRir: number | null;
  explanation: string;
}

export type ProgressionAuditSnapshotV1 = {
  schema_version: "progression_input_v1";
  weight_basis: "rir_adjusted_set_capacity";
  source: {
    exercise_id: string;
    workout_session_id: string;
    workout_session_exercise_id: string;
  };
  config: {
    target_sets: number;
    min_reps: number;
    max_reps: number;
    weight_increment_lbs: number;
  };
  performed_sets: Array<{
    workout_set_id: string;
    position: number;
    kind: SetKind;
    reps: number;
    normalized_weight_lbs: number;
    rir: number | null;
    difficulty: number | null;
    pain: boolean;
    performed_at: string;
  }>;
  recent_sessions: Array<{
    workout_session_id: string;
    workout_session_exercise_id: string;
    started_at: string;
    target_sets: number;
    min_reps: number;
    working_sets: Array<{
      workout_set_id: string;
      position: number;
      reps: number;
      normalized_weight_lbs: number;
      rir: number | null;
      performed_at: string;
    }>;
  }>;
};

export interface PreparedProgressionRecommendation {
  workoutSessionExerciseId: string;
  action: ProgressionAction;
  reason: ProgressionReason;
  recommendedWeightLbs: number | null;
  recommendedMinReps: number | null;
  recommendedMaxReps: number | null;
  recommendedRir: number | null;
  explanation: string;
  engineVersion: "double_progression_v1";
  inputSnapshot: ProgressionAuditSnapshotV1;
}

export interface PersistedProgressionRecommendation {
  id: string;
  action: ProgressionAction;
  reason: ProgressionReason;
  recommendedWeightLbs: number | null;
  recommendedMinReps: number | null;
  recommendedMaxReps: number | null;
  recommendedRir: number | null;
  explanation: string;
  engineVersion: string;
  inputSnapshot: Json;
  createdAt: string;
}
