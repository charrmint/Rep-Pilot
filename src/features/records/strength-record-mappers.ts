import { isValidStrengthSet } from "@/lib/metrics/strength";

import { detectStrengthRecords } from "./strength-record";
import type {
  PersistedStrengthRecord,
  PreparedStrengthRecord,
  StrengthRecord,
  StrengthRecordRow,
  StrengthRecordType,
} from "./types";
import type {
  WorkoutSessionExerciseRow,
  WorkoutSetRow,
} from "../workouts/types";

type StrengthRecordSourceRow = Pick<
  WorkoutSessionExerciseRow,
  "exercise_id" | "workout_session_id"
>;

type StrengthRecordRowWithSource = StrengthRecordRow & {
  source: StrengthRecordSourceRow | null;
};

export function hasValidWorkingStrengthSets({
  exerciseRow,
  setRows,
}: {
  exerciseRow: Pick<WorkoutSessionExerciseRow, "id">;
  setRows: WorkoutSetRow[];
}): boolean {
  return _getValidWorkingStrengthSets(exerciseRow, setRows).length > 0;
}

export function filterValidWorkingStrengthSetRows(
  setRows: WorkoutSetRow[],
): WorkoutSetRow[] {
  return setRows.filter(_isValidWorkingStrengthSetRow);
}

export function prepareStrengthRecords({
  exerciseRow,
  setRows,
  previousRecords = {},
  performedAt,
}: {
  exerciseRow: Pick<
    WorkoutSessionExerciseRow,
    "exercise_id" | "id" | "workout_session_id"
  >;
  setRows: WorkoutSetRow[];
  previousRecords?: Partial<Record<StrengthRecordType, PersistedStrengthRecord>>;
  performedAt: string;
}): PreparedStrengthRecord[] {
  const sets = _getValidWorkingStrengthSets(exerciseRow, setRows);

  if (sets.length === 0) {
    return [];
  }

  return detectStrengthRecords({
    exerciseId: exerciseRow.exercise_id,
    workoutSessionId: exerciseRow.workout_session_id,
    performedAt,
    sets,
    previousRecords,
  }).map((record) => ({
    workoutSessionExerciseId: exerciseRow.id,
    type: record.type,
    value: record.value,
    valueUnit: record.valueUnit,
    previousRecordId:
      record.previousRecord === undefined
        ? null
        : (previousRecords[record.type]?.id ?? null),
    performedAt: record.performedAt,
  }));
}

export function mapStrengthRecordRowToStrengthRecord(
  row: StrengthRecordRow,
  source: StrengthRecordSourceRow,
): StrengthRecord {
  return {
    type: row.record_type,
    value: row.value,
    valueUnit: row.value_unit,
    exerciseId: source.exercise_id,
    workoutSessionId: source.workout_session_id,
    performedAt: row.performed_at,
  };
}

export function mapStrengthRecordRowToPersistedStrengthRecord(
  row: StrengthRecordRowWithSource,
): PersistedStrengthRecord {
  const source = _requireStrengthRecordSource(row);

  return {
    ...mapStrengthRecordRowToStrengthRecord(row, source),
    id: row.id,
    userId: row.user_id,
    workoutSessionExerciseId: row.workout_session_exercise_id,
    previousRecordId: row.previous_record_id,
    createdAt: row.created_at,
  };
}

export function mapStrengthRecordRowsToPersistedStrengthRecords(
  rows: StrengthRecordRowWithSource[],
): PersistedStrengthRecord[] {
  return rows.map(mapStrengthRecordRowToPersistedStrengthRecord);
}

export function attachPreviousStrengthRecords(
  records: PersistedStrengthRecord[],
  previousRecords: PersistedStrengthRecord[],
): PersistedStrengthRecord[] {
  const previousRecordsById = new Map(
    previousRecords.map((record) => [record.id, record]),
  );

  return records.map((record) => {
    const previousRecord = record.previousRecordId
      ? previousRecordsById.get(record.previousRecordId)
      : undefined;

    if (!previousRecord) {
      return record;
    }

    return {
      ...record,
      previousRecord: {
        type: previousRecord.type,
        value: previousRecord.value,
        valueUnit: previousRecord.valueUnit,
        exerciseId: previousRecord.exerciseId,
        workoutSessionId: previousRecord.workoutSessionId,
        performedAt: previousRecord.performedAt,
      },
    };
  });
}

export function mapStrengthRecordRowsToLatestBaselines(
  rows: StrengthRecordRowWithSource[],
): Map<string, Partial<Record<StrengthRecordType, PersistedStrengthRecord>>> {
  const baselines = new Map<
    string,
    Partial<Record<StrengthRecordType, PersistedStrengthRecord>>
  >();
  const records = rows
    .map((row) => mapStrengthRecordRowToPersistedStrengthRecord(row))
    .sort(_compareStrengthRecordBaseline);

  for (const record of records) {
    const exerciseRecords = baselines.get(record.exerciseId) ?? {};

    if (!exerciseRecords[record.type]) {
      exerciseRecords[record.type] = record;
      baselines.set(record.exerciseId, exerciseRecords);
    }
  }

  return baselines;
}

function _getValidWorkingStrengthSets(
  exerciseRow: Pick<WorkoutSessionExerciseRow, "id">,
  setRows: WorkoutSetRow[],
): Array<{ weight: number; reps: number }> {
  return setRows
    .filter((row) => row.workout_session_exercise_id === exerciseRow.id)
    .filter(_isValidWorkingStrengthSetRow)
    .map((row) => ({
      weight: row.normalized_weight_lbs,
      reps: row.reps,
    }));
}

function _isValidWorkingStrengthSetRow(row: WorkoutSetRow): boolean {
  return (
    row.kind === "working" &&
    isValidStrengthSet({
      weight: row.normalized_weight_lbs,
      reps: row.reps,
    })
  );
}

function _requireStrengthRecordSource(
  row: StrengthRecordRowWithSource,
): StrengthRecordSourceRow {
  if (!row.source) {
    throw new Error("Strength record row is missing source context.");
  }

  return row.source;
}

function _compareStrengthRecordBaseline(
  left: PersistedStrengthRecord,
  right: PersistedStrengthRecord,
): number {
  return (
    left.exerciseId.localeCompare(right.exerciseId) ||
    left.type.localeCompare(right.type) ||
    right.value - left.value ||
    Date.parse(right.performedAt) - Date.parse(left.performedAt) ||
    Date.parse(right.createdAt) - Date.parse(left.createdAt) ||
    left.id.localeCompare(right.id)
  );
}
