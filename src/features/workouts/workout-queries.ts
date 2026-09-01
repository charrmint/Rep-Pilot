import { createSupabaseServerClient } from "@/lib/supabase/server";

import type {
  ExerciseHistoryPerformanceRow,
  ExerciseHistorySubjectRow,
  ExerciseHistorySummaryRow,
  PreviousWorkoutSessionExerciseRow,
  TemplateHistorySummaryRow,
  WorkoutHistorySessionRow,
  WorkoutSessionExerciseRow,
  WorkoutSessionRow,
  WorkoutSessionRowWithTemplate,
  WorkoutSessionUpdate,
  WorkoutSetInsert,
  WorkoutSetRow,
  WorkoutSetUpdate,
} from "./types";
import type { WorkoutTemplateRow } from "../templates/types";

const WORKOUT_SESSION_WITH_TEMPLATE_SELECT = `
  *,
  template:workout_templates (
    name
  )
`;

const PREVIOUS_EXERCISE_PERFORMANCE_SELECT = `
  id,
  exercise_id,
  workout_session_id,
  workoutSession:workout_sessions!workout_session_exercises_workout_session_id_fkey!inner (
    started_at
  ),
  sets:workout_sets!workout_sets_workout_session_exercise_id_fkey!inner (
    *
  )
`;

const WORKOUT_HISTORY_SESSION_SELECT = `
  *,
  template:workout_templates (
    name
  ),
  exercises:workout_session_exercises!workout_session_exercises_workout_session_id_fkey (
    id,
    exercise_id,
    exercise_name_snapshot,
    position,
    sets:workout_sets!workout_sets_workout_session_exercise_id_fkey (
      *
    )
  )
`;

const TEMPLATE_HISTORY_SUMMARY_SELECT = `
  template_id,
  started_at,
  template:workout_templates!inner (
    id,
    name,
    is_archived
  )
`;

const EXERCISE_HISTORY_SUMMARY_SELECT = `
  exercise_id,
  exercise_name_snapshot,
  workoutSession:workout_sessions!workout_session_exercises_workout_session_id_fkey!inner (
    started_at
  ),
  sets:workout_sets!workout_sets_workout_session_exercise_id_fkey!inner (
    id
  )
`;

const EXERCISE_HISTORY_PERFORMANCE_SELECT = `
  id,
  exercise_id,
  exercise_name_snapshot,
  workoutSession:workout_sessions!workout_session_exercises_workout_session_id_fkey!inner (
    id,
    status,
    started_at,
    completed_at,
    template_id,
    template:workout_templates (
      name
    )
  ),
  sets:workout_sets!workout_sets_workout_session_exercise_id_fkey!inner (
    *
  )
`;

export async function getActiveWorkoutSessionRow(
  userId: string,
): Promise<WorkoutSessionRowWithTemplate | null> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("workout_sessions")
    .select(WORKOUT_SESSION_WITH_TEMPLATE_SELECT)
    .eq("user_id", userId)
    .eq("status", "in_progress")
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to get active workout: ${error.message}`);
  }

  return data as WorkoutSessionRowWithTemplate | null;
}

export async function getWorkoutSessionRow({
  userId,
  sessionId,
}: {
  userId: string;
  sessionId: string;
}): Promise<WorkoutSessionRowWithTemplate | null> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("workout_sessions")
    .select(WORKOUT_SESSION_WITH_TEMPLATE_SELECT)
    .eq("id", sessionId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to get workout session: ${error.message}`);
  }

  return data as WorkoutSessionRowWithTemplate | null;
}

export async function listWorkoutSessionExerciseRows({
  userId,
  sessionId,
}: {
  userId: string;
  sessionId: string;
}): Promise<WorkoutSessionExerciseRow[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("workout_session_exercises")
    .select("*")
    .eq("user_id", userId)
    .eq("workout_session_id", sessionId)
    .order("position", { ascending: true });

  if (error) {
    throw new Error(`Failed to list workout exercises: ${error.message}`);
  }

  return data ?? [];
}

export async function getWorkoutSessionExerciseRow({
  userId,
  sessionExerciseId,
}: {
  userId: string;
  sessionExerciseId: string;
}): Promise<WorkoutSessionExerciseRow | null> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("workout_session_exercises")
    .select("*")
    .eq("id", sessionExerciseId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to get workout exercise: ${error.message}`);
  }

  return data;
}

export async function listWorkoutSetRows({
  userId,
  sessionExerciseIds,
}: {
  userId: string;
  sessionExerciseIds: string[];
}): Promise<WorkoutSetRow[]> {
  if (sessionExerciseIds.length === 0) {
    return [];
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("workout_sets")
    .select("*")
    .eq("user_id", userId)
    .in("workout_session_exercise_id", sessionExerciseIds)
    .order("position", { ascending: true });

  if (error) {
    throw new Error(`Failed to list workout sets: ${error.message}`);
  }

  return data ?? [];
}

export async function listPreviousWorkoutSessionExerciseRows({
  userId,
  currentSessionId,
  exerciseIds,
}: {
  userId: string;
  currentSessionId: string;
  exerciseIds: string[];
}): Promise<PreviousWorkoutSessionExerciseRow[]> {
  const uniqueExerciseIds = [...new Set(exerciseIds)];

  if (uniqueExerciseIds.length === 0) {
    return [];
  }

  const supabase = await createSupabaseServerClient();
  const rows = await Promise.all(
    uniqueExerciseIds.map(async (exerciseId) => {
      const { data, error } = await supabase
        .from("workout_session_exercises")
        .select(PREVIOUS_EXERCISE_PERFORMANCE_SELECT)
        .eq("user_id", userId)
        .eq("exercise_id", exerciseId)
        .neq("workout_session_id", currentSessionId)
        .eq("workoutSession.status", "completed")
        .eq("sets.kind", "working")
        .order("created_at", { ascending: false })
        .order("position", { ascending: true, referencedTable: "sets" })
        .limit(1)
        .maybeSingle();

      if (error) {
        throw new Error(
          `Failed to get previous exercise performance: ${error.message}`,
        );
      }

      return data as PreviousWorkoutSessionExerciseRow | null;
    }),
  );

  return rows.filter(
    (row): row is PreviousWorkoutSessionExerciseRow => row !== null,
  );
}

export async function listWorkoutHistorySessionRows({
  userId,
  offset,
  limit,
  templateId,
}: {
  userId: string;
  offset: number;
  limit: number;
  templateId?: string;
}): Promise<WorkoutHistorySessionRow[]> {
  const supabase = await createSupabaseServerClient();
  let query = supabase
    .from("workout_sessions")
    .select(WORKOUT_HISTORY_SESSION_SELECT)
    .eq("user_id", userId)
    .in("status", ["completed", "cancelled"])
    .order("started_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (templateId) {
    query = query.eq("template_id", templateId);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to list workout history: ${error.message}`);
  }

  return (data ?? []) as WorkoutHistorySessionRow[];
}

export async function listTemplateHistorySummaryRows(
  userId: string,
): Promise<TemplateHistorySummaryRow[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("workout_sessions")
    .select(TEMPLATE_HISTORY_SUMMARY_SELECT)
    .eq("user_id", userId)
    .in("status", ["completed", "cancelled"])
    .order("started_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to list template history: ${error.message}`);
  }

  return (data ?? []) as TemplateHistorySummaryRow[];
}

export async function getWorkoutHistoryTemplateRow({
  userId,
  templateId,
}: {
  userId: string;
  templateId: string;
}): Promise<WorkoutTemplateRow | null> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("workout_templates")
    .select("*")
    .eq("id", templateId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to get workout history template: ${error.message}`);
  }

  return data;
}

export async function listExerciseHistorySummaryRows(
  userId: string,
): Promise<ExerciseHistorySummaryRow[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("workout_session_exercises")
    .select(EXERCISE_HISTORY_SUMMARY_SELECT)
    .eq("user_id", userId)
    .in("workoutSession.status", ["completed", "cancelled"])
    .eq("sets.kind", "working")
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to list exercise history: ${error.message}`);
  }

  return (data ?? []) as ExerciseHistorySummaryRow[];
}

export async function getExerciseHistorySubjectRow(
  exerciseId: string,
): Promise<ExerciseHistorySubjectRow | null> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("exercises")
    .select("id, name")
    .eq("id", exerciseId)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to get exercise history subject: ${error.message}`);
  }

  return data;
}

export async function listExerciseHistoryPerformanceRows({
  userId,
  exerciseId,
  offset,
  limit,
}: {
  userId: string;
  exerciseId: string;
  offset: number;
  limit: number;
}): Promise<ExerciseHistoryPerformanceRow[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("workout_session_exercises")
    .select(EXERCISE_HISTORY_PERFORMANCE_SELECT)
    .eq("user_id", userId)
    .eq("exercise_id", exerciseId)
    .in("workoutSession.status", ["completed", "cancelled"])
    .eq("sets.kind", "working")
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    throw new Error(
      `Failed to list exercise performances: ${error.message}`,
    );
  }

  return (data ?? []) as ExerciseHistoryPerformanceRow[];
}

export async function startWorkoutSession({
  templateId,
  activeSessionIdToCancel,
}: {
  templateId: string;
  activeSessionIdToCancel?: string;
}): Promise<string> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc("start_workout_from_template", {
    p_template_id: templateId,
    p_active_session_id_to_cancel: activeSessionIdToCancel ?? null,
  });

  if (error) {
    throw new Error(`Failed to start workout: ${error.message}`);
  }

  return data;
}

export async function createWorkoutSetRow(
  input: WorkoutSetInsert,
): Promise<WorkoutSetRow> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("workout_sets")
    .insert(input)
    .select("*")
    .single();

  if (error) {
    throw new Error(`Failed to log workout set: ${error.message}`);
  }

  return data;
}

export async function updateWorkoutSetRow({
  userId,
  sessionExerciseId,
  workoutSetId,
  update,
}: {
  userId: string;
  sessionExerciseId: string;
  workoutSetId: string;
  update: WorkoutSetUpdate;
}): Promise<WorkoutSetRow> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("workout_sets")
    .update(update)
    .eq("id", workoutSetId)
    .eq("user_id", userId)
    .eq("workout_session_exercise_id", sessionExerciseId)
    .select("*")
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to update workout set: ${error.message}`);
  }

  if (!data) {
    throw new Error("Workout set not found.");
  }

  return data;
}

export async function deleteWorkoutSetRow({
  userId,
  sessionExerciseId,
  workoutSetId,
}: {
  userId: string;
  sessionExerciseId: string;
  workoutSetId: string;
}): Promise<void> {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("workout_sets")
    .delete()
    .eq("id", workoutSetId)
    .eq("user_id", userId)
    .eq("workout_session_exercise_id", sessionExerciseId);

  if (error) {
    throw new Error(`Failed to delete workout set: ${error.message}`);
  }
}

export async function updateWorkoutSessionRow({
  userId,
  sessionId,
  update,
}: {
  userId: string;
  sessionId: string;
  update: WorkoutSessionUpdate;
}): Promise<WorkoutSessionRow> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("workout_sessions")
    .update(update)
    .eq("id", sessionId)
    .eq("user_id", userId)
    .select("*")
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to update workout session: ${error.message}`);
  }

  if (!data) {
    throw new Error("Workout session not found.");
  }

  return data;
}
