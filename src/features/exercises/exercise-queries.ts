import { createSupabaseServerClient } from "@/lib/supabase/server";

import type { ExerciseRow } from "./types";

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
