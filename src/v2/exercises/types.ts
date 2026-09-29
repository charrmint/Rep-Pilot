import type { ExerciseLibrary } from "@/features/exercises/types";
import type { WorkoutTemplateDetails } from "@/features/templates/types";

export interface ExerciseManagerData {
  exercises: ExerciseLibrary;
  plans: WorkoutTemplateDetails[];
}
export type ExerciseMutationResult = {
  status: "success" | "error";
  message: string;
  data: ExerciseManagerData | null;
};

export interface PlanAssignmentProps {
  exerciseId: string;
  exerciseName: string;
  plans: WorkoutTemplateDetails[];
  disabled: boolean;
  onAssign: (form: FormData) => void;
}
