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
  activeWorkoutUnavailable?: boolean;
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
  onDelete?: () => void;
  onConfirmDelete?: () => void;
  onCancelDelete?: () => void;
  confirmingDelete?: boolean;
}

export type WorkoutEndIntent = "finish" | "abandon";
export interface WorkoutConfirmationProps {
  intent: WorkoutEndIntent;
  logged: number;
  remaining: number;
  hasDrafts: boolean;
  canFinish: boolean;
  pending: boolean;
  unverified: boolean;
  error: string | null;
  onConfirm: () => void;
  onDismiss: () => void;
  onCheck: () => void;
}
export interface WorkoutResultsProps {
  fromHistory?: boolean;
  workout: WorkoutSession;
}

export interface ExerciseContextProps {
  exercise: WorkoutSessionExercise;
  disabled: boolean;
  onApply: (weight: string) => void;
}

export interface WorkoutOptionsProps {
  disabled: boolean;
  onAbandon: () => void;
}
