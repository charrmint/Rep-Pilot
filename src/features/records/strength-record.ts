import {
    calculateEpleyOneRepMax,
    calculateTotalVolume,
  } from "@/lib/metrics/strength";
  import type {
    DetectedStrengthRecord,
    DetectStrengthRecordsInput,
    StrengthRecord,
  } from "./types";

export function detectStrengthRecords(
    input: DetectStrengthRecordsInput,
): DetectedStrengthRecord[] {
    const { sets, previousRecords = {} } = input;

    if (sets.length === 0) {
        return [];
    }

    const candidates = _buildRecordCandidates(input);

    return candidates
        .filter((candidate) => _isNewRecord(candidate, previousRecords[candidate.type]))
        .map((candidate) => ({
            ...candidate,
            previousRecord: previousRecords[candidate.type]
        }));
}

function _buildRecordCandidates(
    input: DetectStrengthRecordsInput,
): StrengthRecord[] {
    const { exerciseId, workoutSessionId, performedAt, sets } =  input;

    const records: StrengthRecord[] = [
        {
            type: "highest_weight",
            value: Math.max(...sets.map((set) => set.weight)),
            exerciseId,
            workoutSessionId,
            performedAt,
        },
        {
            type: "highest_volume",
            value: calculateTotalVolume(sets),
            exerciseId,
            workoutSessionId,
            performedAt
        }
    ];

    const estimatedOneRepMaxes = sets
        .map(calculateEpleyOneRepMax)
        .filter((value): value is number => value !== null);

    if (estimatedOneRepMaxes.length > 0) {
        records.push({
            type: "highest_estimated_one_rep_max",
            value: Math.max(...estimatedOneRepMaxes),
            exerciseId,
            workoutSessionId,
            performedAt,
        });
    }

    return records;
}

function _isNewRecord(
    candidate: StrengthRecord,
    previousRecord?: StrengthRecord,
): boolean {
    return previousRecord === undefined || candidate.value > previousRecord.value
}

