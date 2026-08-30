import type { PostgrestError } from "@supabase/supabase-js";

import { createSupabaseServerClient } from "@/lib/supabase/server";

import type {
  SetWorkoutTemplateArchiveStatusInput,
  WorkoutTemplateInsert,
  WorkoutTemplateRow,
  WorkoutTemplateUpdate,
} from "./types";

export async function listWorkoutTemplateRows(
  userId: string,
): Promise<WorkoutTemplateRow[]> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("workout_templates")
    .select("*")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to list workout template rows: ${error.message}`);
  }

  return data ?? [];
}

export async function createWorkoutTemplateRow(
  template: WorkoutTemplateInsert,
): Promise<WorkoutTemplateRow> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("workout_templates")
    .insert(template)
    .select("*")
    .single();

  if (error) {
    throw _toTemplateMutationError(error, "Failed to create workout template");
  }

  return data;
}

export async function updateWorkoutTemplateArchiveStatusRow({
  userId,
  templateId,
  isArchived,
}: SetWorkoutTemplateArchiveStatusInput): Promise<WorkoutTemplateRow> {
  const supabase = await createSupabaseServerClient();
  const update: WorkoutTemplateUpdate = { is_archived: isArchived };

  const { data, error } = await supabase
    .from("workout_templates")
    .update(update)
    .eq("id", templateId)
    .eq("user_id", userId)
    .select("*")
    .maybeSingle();

  if (error) {
    throw _toTemplateMutationError(error, "Failed to update workout template");
  }

  if (!data) {
    throw new Error("Workout template not found.");
  }

  return data;
}

function _toTemplateMutationError(
  error: PostgrestError,
  fallback: string,
): Error {
  if (error.code === "23505") {
    return new Error("A template with this name already exists.");
  }

  return new Error(`${fallback}: ${error.message}`);
}
