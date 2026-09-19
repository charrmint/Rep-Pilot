import { createSupabaseServerClient } from "@/lib/supabase/server";

import { mapDemoProgressionRecommendationInsertRows } from "./demo-progression";
import type { DemoProgressionExerciseRow } from "./types";
import type { PreparedProgressionRecommendation } from "../progression/types";

const DEMO_PROGRESSION_EXERCISE_SELECT = `
  *,
  workoutSession:workout_sessions!workout_session_exercises_workout_session_id_fkey!inner (
    started_at,
    status
  ),
  sets:workout_sets!workout_sets_workout_session_exercise_id_fkey!inner (
    *
  )
`;

export async function provisionDemoDataRows(): Promise<void> {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc("provision_demo_data");

  if (error) {
    throw new Error(`Failed to prepare demo data: ${error.message}`);
  }
}

export async function listDemoCompletedProgressionExerciseRows(
  userId: string,
): Promise<DemoProgressionExerciseRow[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("workout_session_exercises")
    .select(DEMO_PROGRESSION_EXERCISE_SELECT)
    .eq("user_id", userId)
    .eq("workoutSession.status", "completed")
    .eq("sets.kind", "working")
    .order("created_at", { ascending: true })
    .order("position", { ascending: true, referencedTable: "sets" });

  if (error) {
    throw new Error(
      `Failed to load demo progression history: ${error.message}`,
    );
  }

  return (data ?? []) as DemoProgressionExerciseRow[];
}

export async function insertDemoProgressionRecommendationRows({
  userId,
  recommendations,
}: {
  userId: string;
  recommendations: PreparedProgressionRecommendation[];
}): Promise<void> {
  if (recommendations.length === 0) {
    return;
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("progression_recommendations")
    .upsert(
      mapDemoProgressionRecommendationInsertRows({
        userId,
        recommendations,
      }),
      {
        onConflict: "workout_session_exercise_id",
        ignoreDuplicates: true,
      },
    );

  if (error) {
    throw new Error(
      `Failed to prepare demo progression recommendations: ${error.message}`,
    );
  }
}

export async function provisionDemoStrengthRecordBaselinesRows(): Promise<void> {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc(
    "provision_demo_strength_record_baselines",
  );

  if (error) {
    throw new Error(
      `Failed to prepare demo strength record baselines: ${error.message}`,
    );
  }
}
