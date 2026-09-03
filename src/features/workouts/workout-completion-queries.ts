import type { Json } from "@/lib/supabase/database.types";
import { createSupabaseServerClient } from "@/lib/supabase/server";

import type {
  CompleteWorkoutWithRecommendationsInput,
  CompleteWorkoutWithResultsInput,
} from "./types";

export async function completeWorkoutWithRecommendationsRow(
  input: CompleteWorkoutWithRecommendationsInput,
): Promise<void> {
  return completeWorkoutWithResultsRow({ ...input, strengthRecords: [] });
}

export async function completeWorkoutWithResultsRow(
  input: CompleteWorkoutWithResultsInput,
): Promise<void> {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc("complete_workout_with_results", {
    p_session_id: input.sessionId,
    p_completed_at: input.completedAt,
    p_recommendations: _mapRecommendationsToRpcJson(input),
    p_strength_records: _mapStrengthRecordsToRpcJson(input),
  });

  if (error) {
    throw new Error(`Failed to complete workout: ${error.message}`);
  }
}

function _mapRecommendationsToRpcJson(
  input: CompleteWorkoutWithRecommendationsInput,
): Json {
  return input.recommendations.map((recommendation) => ({
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
}

function _mapStrengthRecordsToRpcJson(
  input: CompleteWorkoutWithResultsInput,
): Json {
  return input.strengthRecords.map((record) => ({
    workout_session_exercise_id: record.workoutSessionExerciseId,
    record_type: record.type,
    value: record.value,
    value_unit: record.valueUnit,
    previous_record_id: record.previousRecordId,
    performed_at: record.performedAt,
  })) as Json;
}
