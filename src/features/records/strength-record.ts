import {
  calculateEpleyOneRepMax,
  calculateTotalVolume,
  isValidStrengthSet,
} from "@/lib/metrics/strength";
import type {
  DetectedStrengthRecord,
  DetectStrengthRecordsInput,
  StrengthRecord,
  StrengthRecordType,
  StrengthRecordValueUnit,
} from "./types";

export function detectStrengthRecords(
  input: DetectStrengthRecordsInput,
): DetectedStrengthRecord[] {
  const { previousRecords = {} } = input;
  const candidates = _buildRecordCandidates(input);

  return candidates
    .filter((candidate) =>
      _isNewRecord(candidate, previousRecords[candidate.type]),
    )
    .map((candidate) => ({
      ...candidate,
      previousRecord: previousRecords[candidate.type],
    }));
}

function _buildRecordCandidates(
  input: DetectStrengthRecordsInput,
): StrengthRecord[] {
  const { sets } = input;
  const validSets = sets.filter(isValidStrengthSet);

  if (validSets.length === 0) {
    return [];
  }

  const records: StrengthRecord[] = [
    _buildRecordCandidate({
      input,
      type: "highest_weight",
      value: Math.max(...validSets.map((set) => set.weight)),
      valueUnit: "lb",
    }),
    _buildRecordCandidate({
      input,
      type: "highest_volume",
      value: calculateTotalVolume(validSets),
      valueUnit: "lb_reps",
    }),
  ];

  const estimatedOneRepMaxes = validSets
    .map(calculateEpleyOneRepMax)
    .filter((value): value is number => value !== null);

  if (estimatedOneRepMaxes.length > 0) {
    records.push(
      _buildRecordCandidate({
        input,
        type: "highest_estimated_one_rep_max",
        value: Math.max(...estimatedOneRepMaxes),
        valueUnit: "lb",
      }),
    );
  }

  return records;
}

function _buildRecordCandidate({
  input,
  type,
  value,
  valueUnit,
}: {
  input: Pick<
    DetectStrengthRecordsInput,
    "exerciseId" | "workoutSessionId" | "performedAt"
  >;
  type: StrengthRecordType;
  value: number;
  valueUnit: StrengthRecordValueUnit;
}): StrengthRecord {
  return {
    type,
    value: _roundRecordValue(value),
    valueUnit,
    exerciseId: input.exerciseId,
    workoutSessionId: input.workoutSessionId,
    performedAt: input.performedAt,
  };
}

function _isNewRecord(
  candidate: StrengthRecord,
  previousRecord?: StrengthRecord,
): boolean {
  return (
    previousRecord === undefined ||
    candidate.value > _roundRecordValue(previousRecord.value)
  );
}

function _roundRecordValue(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}
