import type { StrengthSet } from "@/lib/metrics/types";
import type { Enums, Tables } from "@/lib/supabase/database.types";

export type StrengthRecordRow = Tables<"strength_records">;
export type StrengthRecordType = Enums<"strength_record_type">;
export type StrengthRecordValueUnit = Enums<"strength_record_value_unit">;

export interface StrengthRecord {
  type: StrengthRecordType;
  value: number;
  valueUnit: StrengthRecordValueUnit;
  exerciseId: string;
  workoutSessionId: string;
  performedAt: string;
}

export type PreviousStrengthRecords = Partial<
  Record<StrengthRecordType, StrengthRecord>
>;

export interface DetectedStrengthRecord extends StrengthRecord {
  previousRecord?: StrengthRecord;
}

export interface DetectStrengthRecordsInput {
  exerciseId: string;
  workoutSessionId: string;
  performedAt: string;
  sets: StrengthSet[];
  previousRecords?: PreviousStrengthRecords;
}

export interface PreparedStrengthRecord {
  workoutSessionExerciseId: string;
  type: StrengthRecordType;
  value: number;
  valueUnit: StrengthRecordValueUnit;
  previousRecordId: string | null;
  performedAt: string;
}

export interface PersistedStrengthRecord extends StrengthRecord {
  id: StrengthRecordRow["id"];
  userId: StrengthRecordRow["user_id"];
  workoutSessionExerciseId: StrengthRecordRow["workout_session_exercise_id"];
  previousRecordId: StrengthRecordRow["previous_record_id"];
  createdAt: StrengthRecordRow["created_at"];
  previousRecord?: StrengthRecord;
}
