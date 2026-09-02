import type {
  Enums,
  Tables,
  TablesInsert,
  TablesUpdate,
} from "@/lib/supabase/database.types";
import type { WeightUnit } from "@/lib/units/types";

import type { ExerciseRow } from "../exercises/types";
import type {
  PersistedProgressionRecommendation,
  PreparedProgressionRecommendation,
} from "../progression/types";
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

export type PreviousWorkoutSessionExerciseRow = Pick<
  WorkoutSessionExerciseRow,
  "exercise_id" | "id" | "workout_session_id"
> & {
  workoutSession: Pick<WorkoutSessionRow, "started_at">;
  sets: WorkoutSetRow[];
};

export type WorkoutHistorySessionExerciseRow = Pick<
  WorkoutSessionExerciseRow,
  "exercise_id" | "exercise_name_snapshot" | "id" | "position"
> & {
  sets: WorkoutSetRow[];
};

export type WorkoutHistorySessionRow = WorkoutSessionRowWithTemplate & {
  exercises: WorkoutHistorySessionExerciseRow[];
};

export type TemplateHistorySummaryRow = Pick<
  WorkoutSessionRow,
  "started_at" | "template_id"
> & {
  template: Pick<WorkoutTemplateRow, "id" | "is_archived" | "name"> | null;
};

export type ExerciseHistorySummaryRow = Pick<
  WorkoutSessionExerciseRow,
  "exercise_id" | "exercise_name_snapshot"
> & {
  workoutSession: Pick<WorkoutSessionRow, "started_at">;
  sets: Array<Pick<WorkoutSetRow, "id">>;
};

export type ExerciseHistoryPerformanceRow = Pick<
  WorkoutSessionExerciseRow,
  "id" | "exercise_id" | "exercise_name_snapshot"
> & {
  workoutSession: Pick<
    WorkoutSessionRow,
    "completed_at" | "id" | "started_at" | "status" | "template_id"
  > & {
    template: Pick<WorkoutTemplateRow, "name"> | null;
  };
  sets: WorkoutSetRow[];
};

export type ExerciseHistorySubjectRow = Pick<ExerciseRow, "id" | "name">;

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
  rir: number | null;
  performedAt: string;
}

export interface PreviousExercisePerformance {
  workoutSessionId: string;
  workoutSessionExerciseId: string;
  startedAt: string;
  sets: WorkoutSet[];
}

export interface PaginatedHistory<T> {
  items: T[];
  page: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}

export interface WorkoutHistoryExercise {
  sessionExerciseId: string;
  exerciseId: string;
  exerciseName: string;
  position: number;
  sets: WorkoutSet[];
}

export interface WorkoutHistorySession {
  id: string;
  templateId: string | null;
  templateName: string;
  status: Exclude<WorkoutSessionStatus, "in_progress">;
  startedAt: string;
  completedAt: string | null;
  exercises: WorkoutHistoryExercise[];
}

export interface TemplateHistorySummary {
  templateId: string;
  templateName: string;
  isArchived: boolean;
  lastPerformedAt: string;
  workoutCount: number;
}

export interface WorkoutHistoryTemplate {
  id: string;
  name: string;
  isArchived: boolean;
}

export interface TemplateHistory {
  template: WorkoutHistoryTemplate;
  workouts: PaginatedHistory<WorkoutHistorySession>;
}

export interface ExerciseHistorySummary {
  exerciseId: string;
  exerciseName: string;
  lastPerformedAt: string;
  performanceCount: number;
}

export interface ExerciseHistoryPerformance {
  sessionExerciseId: string;
  workoutSessionId: string;
  templateId: string | null;
  templateName: string;
  sessionStatus: Exclude<WorkoutSessionStatus, "in_progress">;
  startedAt: string;
  completedAt: string | null;
  sets: WorkoutSet[];
}

export interface ExerciseHistory {
  exerciseId: string;
  exerciseName: string;
  performances: PaginatedHistory<ExerciseHistoryPerformance>;
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
  previousPerformance: PreviousExercisePerformance | null;
  recommendation: PersistedProgressionRecommendation | null;
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
  rir?: number | null;
}

export interface DeleteWorkoutSetInput {
  sessionExerciseId: string;
  workoutSetId: string;
}

export interface ValidatedWorkoutSetInput extends SaveWorkoutSetInput {
  rir: number | null;
  normalizedWeightLbs: number;
}

export interface CompleteWorkoutWithRecommendationsInput {
  sessionId: string;
  completedAt: string;
  recommendations: PreparedProgressionRecommendation[];
}
