import type {
  Tables,
  TablesInsert,
  TablesUpdate,
} from "@/lib/supabase/database.types";

export type WorkoutTemplateRow = Tables<"workout_templates">;
export type WorkoutTemplateInsert = TablesInsert<"workout_templates">;
export type WorkoutTemplateUpdate = TablesUpdate<"workout_templates">;

export interface WorkoutTemplate {
  id: string;
  name: string;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface WorkoutTemplateLibrary {
  activeTemplates: WorkoutTemplate[];
  archivedTemplates: WorkoutTemplate[];
}

export interface CreateWorkoutTemplateInput {
  userId: string;
  name: string;
}

export interface SetWorkoutTemplateArchiveStatusInput {
  userId: string;
  templateId: string;
  isArchived: boolean;
}
