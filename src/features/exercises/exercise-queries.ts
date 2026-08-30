import type { PostgrestError } from "@supabase/supabase-js";

import { createSupabaseServerClient } from "@/lib/supabase/server";

import type {
  ExerciseInsert,
  ExerciseRow,
  ExerciseUpdate,
  SetCustomExerciseArchiveStatusInput,
} from "./types";

export async function listAvailableExerciseRows(): Promise<ExerciseRow[]> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("exercises")
    .select("*")
    .eq("is_archived", false)
    .order("name", { ascending: true });

  if (error) {
    throw new Error(`Failed to list exercise rows: ${error.message}`);
  }

  return data ?? [];
}

export async function listExerciseLibraryRows(): Promise<ExerciseRow[]> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("exercises")
    .select("*")
    .order("name", { ascending: true });

  if (error) {
    throw new Error(`Failed to list exercise library rows: ${error.message}`);
  }

  return data ?? [];
}

export async function createCustomExerciseRow(
  exercise: ExerciseInsert,
): Promise<ExerciseRow> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("exercises")
    .insert(exercise)
    .select("*")
    .single();

  if (error) {
    throw _toExerciseMutationError(error, "Failed to create custom exercise");
  }

  return data;
}

export async function updateCustomExerciseArchiveStatusRow({
  userId,
  exerciseId,
  isArchived,
}: SetCustomExerciseArchiveStatusInput): Promise<ExerciseRow> {
  const supabase = await createSupabaseServerClient();
  const update: ExerciseUpdate = { is_archived: isArchived };

  const { data, error } = await supabase
    .from("exercises")
    .update(update)
    .eq("id", exerciseId)
    .eq("user_id", userId)
    .select("*")
    .maybeSingle();

  if (error) {
    throw _toExerciseMutationError(
      error,
      "Failed to update custom exercise",
    );
  }

  if (!data) {
    throw new Error("Custom exercise not found.");
  }

  return data;
}

function _toExerciseMutationError(
  error: PostgrestError,
  fallback: string,
): Error {
  if (error.code === "23505") {
    return new Error("An exercise with this name already exists.");
  }

  return new Error(`${fallback}: ${error.message}`);
}
