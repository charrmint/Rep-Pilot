import type { AuthUser } from "@supabase/supabase-js";
import type { ActiveWorkoutSummary } from "@/features/workouts/types";

export interface V2Context {
  user: AuthUser | null;
  activeWorkout: ActiveWorkoutSummary | null;
  activeWorkoutUnavailable: boolean;
}
