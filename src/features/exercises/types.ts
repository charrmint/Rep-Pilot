import type { Tables } from "@/lib/supabase/database.types";

export type ExerciseRow = Tables<"exercises">;

export interface Exercise {
  id: string;
  name: string;
  isArchived: boolean;
  isSystemExercise: boolean;
}
