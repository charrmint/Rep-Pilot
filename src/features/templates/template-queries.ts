import type { PostgrestError } from "@supabase/supabase-js";

import { createSupabaseServerClient } from "@/lib/supabase/server";

import type {
  RemoveWorkoutTemplateExerciseInput,
  SetWorkoutTemplateArchiveStatusInput,
  WorkoutTemplateExerciseInsert,
  WorkoutTemplateExerciseRow,
  WorkoutTemplateExerciseRowWithExercise,
  WorkoutTemplateExerciseUpdate,
  WorkoutTemplateInsert,
  WorkoutTemplateRow,
  WorkoutTemplateUpdate,
} from "./types";

const TEMPLATE_EXERCISE_WITH_EXERCISE_SELECT = `
  *,
  exercise:exercises (
    id,
    is_archived,
    name,
    user_id
  )
`;

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

export async function getWorkoutTemplateRow({
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
    throw new Error(`Failed to get workout template row: ${error.message}`);
  }

  return data;
}

export async function listWorkoutTemplateExerciseRows(
  userId: string,
  templateId: string,
): Promise<WorkoutTemplateExerciseRowWithExercise[]> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("workout_template_exercises")
    .select(TEMPLATE_EXERCISE_WITH_EXERCISE_SELECT)
    .eq("user_id", userId)
    .eq("template_id", templateId)
    .order("position", { ascending: true });

  if (error) {
    throw new Error(
      `Failed to list workout template exercise rows: ${error.message}`,
    );
  }

  return (data ?? []) as WorkoutTemplateExerciseRowWithExercise[];
}

export async function listWorkoutTemplateExerciseRowsForTemplates(
  userId: string,
  templateIds: string[],
): Promise<WorkoutTemplateExerciseRowWithExercise[]> {
  if (templateIds.length === 0) {
    return [];
  }

  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("workout_template_exercises")
    .select(TEMPLATE_EXERCISE_WITH_EXERCISE_SELECT)
    .eq("user_id", userId)
    .in("template_id", templateIds)
    .order("position", { ascending: true });

  if (error) {
    throw new Error(
      `Failed to list workout template exercise rows: ${error.message}`,
    );
  }

  return (data ?? []) as WorkoutTemplateExerciseRowWithExercise[];
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

export async function updateWorkoutTemplateNameRow({
  userId,
  templateId,
  name,
}: {
  userId: string;
  templateId: string;
  name: string;
}): Promise<WorkoutTemplateRow> {
  const supabase = await createSupabaseServerClient();
  const update: WorkoutTemplateUpdate = { name };

  const { data, error } = await supabase
    .from("workout_templates")
    .update(update)
    .eq("id", templateId)
    .eq("user_id", userId)
    .select("*")
    .maybeSingle();

  if (error) {
    throw _toTemplateMutationError(error, "Failed to rename workout template");
  }

  if (!data) {
    throw new Error("Workout template not found.");
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

export async function createWorkoutTemplateExerciseRow(
  templateExercise: WorkoutTemplateExerciseInsert,
): Promise<WorkoutTemplateExerciseRow> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("workout_template_exercises")
    .insert(templateExercise)
    .select("*")
    .single();

  if (error) {
    throw _toTemplateMutationError(
      error,
      "Failed to add exercise to template",
    );
  }

  return data;
}

export async function updateWorkoutTemplateExerciseConfigRow({
  userId,
  templateId,
  templateExerciseId,
  update,
}: {
  userId: string;
  templateId: string;
  templateExerciseId: string;
  update: WorkoutTemplateExerciseUpdate;
}): Promise<WorkoutTemplateExerciseRow> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("workout_template_exercises")
    .update(update)
    .eq("id", templateExerciseId)
    .eq("user_id", userId)
    .eq("template_id", templateId)
    .select("*")
    .maybeSingle();

  if (error) {
    throw _toTemplateMutationError(
      error,
      "Failed to update template exercise",
    );
  }

  if (!data) {
    throw new Error("Template exercise not found.");
  }

  return data;
}

export async function updateWorkoutTemplateExercisePositionRow({
  userId,
  templateId,
  templateExerciseId,
  position,
}: {
  userId: string;
  templateId: string;
  templateExerciseId: string;
  position: number;
}): Promise<WorkoutTemplateExerciseRow> {
  const supabase = await createSupabaseServerClient();
  const update: WorkoutTemplateExerciseUpdate = { position };

  const { data, error } = await supabase
    .from("workout_template_exercises")
    .update(update)
    .eq("id", templateExerciseId)
    .eq("user_id", userId)
    .eq("template_id", templateId)
    .select("*")
    .maybeSingle();

  if (error) {
    throw _toTemplateMutationError(
      error,
      "Failed to move template exercise",
    );
  }

  if (!data) {
    throw new Error("Template exercise not found.");
  }

  return data;
}

export async function deleteWorkoutTemplateExerciseRow({
  userId,
  templateId,
  templateExerciseId,
}: RemoveWorkoutTemplateExerciseInput): Promise<WorkoutTemplateExerciseRow> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("workout_template_exercises")
    .delete()
    .eq("id", templateExerciseId)
    .eq("user_id", userId)
    .eq("template_id", templateId)
    .select("*")
    .maybeSingle();

  if (error) {
    throw _toTemplateMutationError(
      error,
      "Failed to remove template exercise",
    );
  }

  if (!data) {
    throw new Error("Template exercise not found.");
  }

  return data;
}

function _toTemplateMutationError(
  error: PostgrestError,
  fallback: string,
): Error {
  if (error.code === "23505") {
    return new Error(
      "A template or template exercise with this value already exists.",
    );
  }

  return new Error(`${fallback}: ${error.message}`);
}
