import type { TablesInsert } from "@/lib/supabase/database.types";

import type {
  WorkoutSessionExerciseRow,
  WorkoutSessionRow,
  WorkoutSetRow,
} from "../workouts/types";

export interface DemoUserIdentity {
  userId: string;
  isAnonymous: boolean;
}

export type DemoProgressionExerciseRow = WorkoutSessionExerciseRow & {
  workoutSession: Pick<WorkoutSessionRow, "started_at" | "status">;
  sets: WorkoutSetRow[];
};

export interface DemoProgressionPerformance {
  exerciseRow: WorkoutSessionExerciseRow;
  workoutSession: Pick<WorkoutSessionRow, "started_at" | "status">;
  sets: WorkoutSetRow[];
}

export type DemoProgressionRecommendationInsert =
  TablesInsert<"progression_recommendations">;
