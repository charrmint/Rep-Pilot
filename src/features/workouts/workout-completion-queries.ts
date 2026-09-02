import type { Json } from "@/lib/supabase/database.types";
import { createSupabaseServerClient } from "@/lib/supabase/server";

import type { CompleteWorkoutWithRecommendationsInput } from "./types";

export async function completeWorkoutWithRecommendationsRow(
  input: CompleteWorkoutWithRecommendationsInput,
): Promise<void> {
  const supabase = await createSupabaseServerClient();
  const recommendations = input.recommendations.map((recommendation) => ({
    workout_session_exercise_id: recommendation.workoutSessionExerciseId,
    action: recommendation.action,
    reason: recommendation.reason,
    recommended_weight_lbs: recommendation.recommendedWeightLbs,
    recommended_min_reps: recommendation.recommendedMinReps,
    recommended_max_reps: recommendation.recommendedMaxReps,
    recommended_rir: recommendation.recommendedRir,
    explanation: recommendation.explanation,
    engine_version: recommendation.engineVersion,
    input_snapshot: recommendation.inputSnapshot,
  })) as Json;
  const { error } = await supabase.rpc(
    "complete_workout_with_recommendations",
    {
      p_session_id: input.sessionId,
      p_completed_at: input.completedAt,
      p_recommendations: recommendations,
    },
  );

  if (error) {
    throw new Error(`Failed to complete workout: ${error.message}`);
  }
}
