import type {
  Enums,
  Tables,
  TablesInsert,
  TablesUpdate,
} from "@/lib/supabase/database.types";
import type { WeightUnit } from "@/lib/units/types";

import type { WorkoutTemplateRow } from "../templates/types";

export type WorkoutSessionRow = Tables<"workout_sessions">;
export type WorkoutSessionExerciseRow = Tables<"workout_session_exercises">;
export type WorkoutSetRow = Tables<"workout_sets">;
export type WorkoutSetInsert = TablesInsert<"workout_sets">;
export type WorkoutSetUpdate = TablesUpdate<"workout_sets">;
export type WorkoutSessionUpdate = TablesUpdate<"workout_sessions">;
export type WorkoutSessionStatus = Enums<"workout_session_status">;

export type WorkoutSessionRowWithTemplate = WorkoutSessionRow & {
  template: Pick<WorkoutTemplateRow, "name"> | null;
};

export interface ActiveWorkoutSummary {
  id: string;
  templateName: string;
  startedAt: string;
}

export interface WorkoutSet {
  id: string;
  position: number;
  reps: number;
  weightValue: number;
  weightUnit: WeightUnit;
  normalizedWeightLbs: number;
  performedAt: string;
}

export interface WorkoutSessionExercise {
  id: string;
  exerciseId: string;
  exerciseName: string;
  position: number;
  targetSets: number;
  minReps: number;
  maxReps: number;
  plannedWeightValue: number;
  plannedWeightUnit: WeightUnit;
  plannedNormalizedWeightLbs: number;
  weightIncrementLbs: number;
  sets: WorkoutSet[];
}

export interface WorkoutSession {
  id: string;
  templateName: string;
  status: WorkoutSessionStatus;
  startedAt: string;
  completedAt: string | null;
  exercises: WorkoutSessionExercise[];
}

export interface StartWorkoutInput {
  templateId: string;
  activeSessionIdToCancel?: string;
}

export interface SaveWorkoutSetInput {
  sessionExerciseId: string;
  workoutSetId?: string;
  position: number;
  reps: number;
  weightValue: number;
  weightUnit: WeightUnit;
}

export interface DeleteWorkoutSetInput {
  sessionExerciseId: string;
  workoutSetId: string;
}

export interface ValidatedWorkoutSetInput extends SaveWorkoutSetInput {
  normalizedWeightLbs: number;
}
