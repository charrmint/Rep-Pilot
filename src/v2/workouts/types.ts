import type {
  ActiveWorkoutSummary,
  WorkoutSession,
  WorkoutSessionExercise,
} from "@/features/workouts/types";
import type { WeightUnit } from "@/lib/units/types";

export interface SetDraft {
  weight: string;
  reps: string;
  rir: number | null;
  unit: WeightUnit;
  dirty: boolean;
}
export type ExerciseDrafts = Record<string, Partial<Record<number, SetDraft>>>;
export interface StartWorkoutProps {
  templateId: string;
  hasExercises: boolean;
  activeWorkout: ActiveWorkoutSummary | null;
}
export interface WorkoutScreenProps {
  initialWorkout: WorkoutSession;
}
export interface SetEditorProps {
  exercise: WorkoutSessionExercise;
  position: number;
  draft: SetDraft;
  editing: boolean;
  disabled: boolean;
  onChange: (draft: SetDraft) => void;
  onSave: () => void;
  onCancel: () => void;
}
