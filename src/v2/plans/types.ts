import type { Exercise } from "@/features/exercises/types";
import type { WorkoutTemplateDetails, WorkoutTemplateExerciseConfigInput } from "@/features/templates/types";
import type { WorkoutTemplate } from "@/features/templates/types";

export type PlanNameResult =
  | { status: "success"; plan: Pick<WorkoutTemplate, "id" | "name"> }
  | { status: "error"; message: string };

export interface PlanNameFormProps {
  plan?: Pick<WorkoutTemplate, "id" | "name">;
  disabled?: boolean;
  onActivityChange?: (dirty: boolean, pending: boolean) => void;
}

export interface PlanEditorData {
  plan: WorkoutTemplateDetails;
  availableExercises: Exercise[];
}

export type PlanExerciseIntent = "add" | "save" | "remove" | "move_up" | "move_down";
export type PlanExerciseDraft = Record<keyof WorkoutTemplateExerciseConfigInput, string>;
export type PlanExerciseResult =
  | { status: "success"; data: PlanEditorData; message: string }
  | { status: "error"; data: PlanEditorData | null; message: string };

export interface PlanConfigFieldsProps {
  prefix: string;
  draft: PlanExerciseDraft;
  onChange: (draft: PlanExerciseDraft) => void;
}

export interface ExercisePickerProps {
  exercises: Exercise[];
  selectedId: string;
  query: string;
  disabled: boolean;
  onQueryChange: (query: string) => void;
  onSelect: (exercise: Exercise) => void;
}
