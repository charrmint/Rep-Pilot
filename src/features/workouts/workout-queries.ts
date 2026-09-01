import { createSupabaseServerClient } from "@/lib/supabase/server";

import type {
  WorkoutSessionExerciseRow,
  WorkoutSessionRow,
  WorkoutSessionRowWithTemplate,
  WorkoutSessionUpdate,
  WorkoutSetInsert,
  WorkoutSetRow,
  WorkoutSetUpdate,
} from "./types";

const WORKOUT_SESSION_WITH_TEMPLATE_SELECT = `
  *,
  template:workout_templates (
    name
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
