import { createSupabaseServerClient } from "@/lib/supabase/server";

import {
  attachPreviousStrengthRecords,
  mapStrengthRecordRowsToLatestBaselines,
  mapStrengthRecordRowsToPersistedStrengthRecords,
} from "./strength-record-mappers";
import type { PersistedStrengthRecord, StrengthRecordType } from "./types";

const STRENGTH_RECORD_WITH_SOURCE_SELECT = `
  *,
  source:workout_session_exercises!strength_records_workout_session_exercise_id_fkey!inner (
    exercise_id,
    workout_session_id
  )
`;

export async function listLatestStrengthRecordBaselinesByExercise({
  userId,
  exerciseIds,
}: {
  userId: string;
  exerciseIds: string[];
}): Promise<
  Map<string, Partial<Record<StrengthRecordType, PersistedStrengthRecord>>>
> {
  const uniqueExerciseIds = [...new Set(exerciseIds)];

  if (uniqueExerciseIds.length === 0) {
    return new Map();
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("strength_records")
    .select(STRENGTH_RECORD_WITH_SOURCE_SELECT)
    .eq("user_id", userId)
    .in("source.exercise_id", uniqueExerciseIds);

  if (error) {
    throw new Error(`Failed to load strength record baselines: ${error.message}`);
  }

  return mapStrengthRecordRowsToLatestBaselines(data ?? []);
}

export async function listStrengthRecordsForSessionExercises({
  userId,
  sessionExerciseIds,
}: {
  userId: string;
  sessionExerciseIds: string[];
}): Promise<PersistedStrengthRecord[]> {
  if (sessionExerciseIds.length === 0) {
    return [];
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("strength_records")
    .select(STRENGTH_RECORD_WITH_SOURCE_SELECT)
    .eq("user_id", userId)
    .in("workout_session_exercise_id", sessionExerciseIds)
    .order("record_type", { ascending: true })
    .order("performed_at", { ascending: true });

  if (error) {
    throw new Error(`Failed to load strength records: ${error.message}`);
  }

  const records = mapStrengthRecordRowsToPersistedStrengthRecords(data ?? []);
  const previousRecordIds = [
    ...new Set(
      records.flatMap((record) =>
        record.previousRecordId ? [record.previousRecordId] : [],
      ),
    ),
  ];

  if (previousRecordIds.length === 0) {
    return records;
  }

  const { data: previousData, error: previousError } = await supabase
    .from("strength_records")
    .select(STRENGTH_RECORD_WITH_SOURCE_SELECT)
    .eq("user_id", userId)
    .in("id", previousRecordIds);

  if (previousError) {
    throw new Error(
      `Failed to load previous strength records: ${previousError.message}`,
    );
  }

  return attachPreviousStrengthRecords(
    records,
    mapStrengthRecordRowsToPersistedStrengthRecords(previousData ?? []),
  );
}
