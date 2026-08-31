import type {
  Tables,
  TablesInsert,
  TablesUpdate,
} from "@/lib/supabase/database.types";
import type { WeightUnit } from "@/lib/units/types";

import type { ExerciseRow } from "../exercises/types";

export type WorkoutTemplateRow = Tables<"workout_templates">;
export type WorkoutTemplateInsert = TablesInsert<"workout_templates">;
export type WorkoutTemplateUpdate = TablesUpdate<"workout_templates">;
export type WorkoutTemplateExerciseRow =
  Tables<"workout_template_exercises">;
export type WorkoutTemplateExerciseInsert =
  TablesInsert<"workout_template_exercises">;
export type WorkoutTemplateExerciseUpdate =
  TablesUpdate<"workout_template_exercises">;

export type WorkoutTemplateExerciseRowWithExercise =
  WorkoutTemplateExerciseRow & {
    exercise: Pick<
      ExerciseRow,
      "id" | "is_archived" | "name" | "user_id"
    > | null;
  };

export interface WorkoutTemplate {
  id: string;
  name: string;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface WorkoutTemplateExerciseConfig {
  targetSets: number;
  minReps: number;
  maxReps: number;
  defaultWeightValue: number;
  defaultWeightUnit: WeightUnit;
  defaultNormalizedWeightLbs: number;
  weightIncrementLbs: number;
}

export interface WorkoutTemplateExercise {
  id: string;
  templateId: string;
  exerciseId: string;
  exerciseName: string;
  exerciseIsArchived: boolean;
  exerciseIsSystemExercise: boolean;
  position: number;
  config: WorkoutTemplateExerciseConfig;
}

export interface WorkoutTemplateDetails extends WorkoutTemplate {
  exercises: WorkoutTemplateExercise[];
}

export interface WorkoutTemplateLibrary {
  activeTemplates: WorkoutTemplateDetails[];
  archivedTemplates: WorkoutTemplateDetails[];
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

export interface RenameWorkoutTemplateInput {
  userId: string;
  templateId: string;
  name: string;
}

export interface WorkoutTemplateExerciseConfigInput {
  targetSets: number;
  minReps: number;
  maxReps: number;
  defaultWeightValue: number;
  defaultWeightUnit: WeightUnit;
  weightIncrementLbs: number;
}

export interface AddWorkoutTemplateExerciseInput {
  userId: string;
  templateId: string;
  exerciseId: string;
  config: WorkoutTemplateExerciseConfigInput;
}

export interface UpdateWorkoutTemplateExerciseInput {
  userId: string;
  templateId: string;
  templateExerciseId: string;
  config: WorkoutTemplateExerciseConfigInput;
}

export interface RemoveWorkoutTemplateExerciseInput {
  userId: string;
  templateId: string;
  templateExerciseId: string;
}

export type WorkoutTemplateExerciseMoveDirection = "move_up" | "move_down";

export interface MoveWorkoutTemplateExerciseInput {
  userId: string;
  templateId: string;
  templateExerciseId: string;
  direction: WorkoutTemplateExerciseMoveDirection;
}
