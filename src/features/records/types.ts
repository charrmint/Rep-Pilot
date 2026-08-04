import { StrengthSet } from "@/lib/metrics/types";

export type StrengthRecordType = 
    | "highest_weight"
    | "highest_estimated_one_rep_max"
    | "highest_volume"

export interface StrengthRecord {
    type: StrengthRecordType;
    value: number;
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
