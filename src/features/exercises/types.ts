import type {
  Tables,
  TablesInsert,
  TablesUpdate,
} from "@/lib/supabase/database.types";

export type ExerciseRow = Tables<"exercises">;
export type ExerciseInsert = TablesInsert<"exercises">;
export type ExerciseUpdate = TablesUpdate<"exercises">;

export interface Exercise {
  id: string;
  name: string;
  isArchived: boolean;
  isSystemExercise: boolean;
}

export interface ExerciseLibrary {
  activeExercises: Exercise[];
  archivedCustomExercises: Exercise[];
}

export interface CreateCustomExerciseInput {
  userId: string;
  name: string;
}

// TODO: can this type be merged into another?
export interface SetCustomExerciseArchiveStatusInput {
  userId: string;
  exerciseId: string;
  isArchived: boolean;
}
