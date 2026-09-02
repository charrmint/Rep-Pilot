import { createSupabaseServerClient } from "@/lib/supabase/server";

import type {
  ProgressionRecommendationRow,
  RecentProgressionExerciseRow,
} from "./types";

const RECENT_PROGRESSION_EXERCISE_SELECT = `
  id,
  exercise_id,
  workout_session_id,
  target_sets,
  min_reps,
  workoutSession:workout_sessions!workout_session_exercises_workout_session_id_fkey!inner (
    started_at
  ),
  sets:workout_sets!workout_sets_workout_session_exercise_id_fkey!inner (
    *
  )
`;

export async function listRecentProgressionExerciseRows({
  userId,
  currentSessionId,
  exerciseIds,
}: {
  userId: string;
  currentSessionId: string;
  exerciseIds: string[];
}): Promise<RecentProgressionExerciseRow[]> {
  const uniqueExerciseIds = [...new Set(exerciseIds)];

  if (uniqueExerciseIds.length === 0) {
    return [];
  }

  const supabase = await createSupabaseServerClient();
  const rowGroups = await Promise.all(
    uniqueExerciseIds.map(async (exerciseId) => {
      const { data, error } = await supabase
        .from("workout_session_exercises")
        .select(RECENT_PROGRESSION_EXERCISE_SELECT)
        .eq("user_id", userId)
        .eq("exercise_id", exerciseId)
        .neq("workout_session_id", currentSessionId)
        .eq("workoutSession.status", "completed")
        .eq("sets.kind", "working")
        .order("created_at", { ascending: false })
        .order("position", { ascending: true, referencedTable: "sets" })
        .limit(2);

      if (error) {
        throw new Error(
          `Failed to load progression history: ${error.message}`,
        );
      }

      return (data ?? []) as RecentProgressionExerciseRow[];
    }),
  );

  return rowGroups.flat();
}

export async function listProgressionRecommendationRows({
  userId,
  sessionExerciseIds,
}: {
  userId: string;
  sessionExerciseIds: string[];
}): Promise<ProgressionRecommendationRow[]> {
  if (sessionExerciseIds.length === 0) {
    return [];
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("progression_recommendations")
    .select("*")
    .eq("user_id", userId)
    .in("workout_session_exercise_id", sessionExerciseIds);

  if (error) {
    throw new Error(`Failed to load recommendations: ${error.message}`);
  }

  return data ?? [];
}
