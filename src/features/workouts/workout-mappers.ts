import type {
  ActiveWorkoutSummary,
  ExerciseHistoryPerformance,
  ExerciseHistoryPerformanceRow,
  ExerciseHistorySummary,
  ExerciseHistorySummaryRow,
  PreviousExercisePerformance,
  PreviousWorkoutSessionExerciseRow,
  TemplateHistorySummary,
  TemplateHistorySummaryRow,
  WorkoutHistoryExercise,
  WorkoutHistorySession,
  WorkoutHistorySessionExerciseRow,
  WorkoutHistorySessionRow,
  WorkoutSession,
  WorkoutSessionExercise,
  WorkoutSessionExerciseRow,
  WorkoutSessionRow,
  WorkoutSessionRowWithTemplate,
  WorkoutSet,
  WorkoutSetRow,
} from "./types";
import { mapProgressionRecommendationRow } from "../progression/progression-mappers";
import type { ProgressionRecommendationRow } from "../progression/types";
import type { PersistedStrengthRecord } from "../records/types";

export function mapWorkoutHistorySessionRows(
  rows: WorkoutHistorySessionRow[],
): WorkoutHistorySession[] {
  return rows.map(_mapWorkoutHistorySessionRow);
}

export function mapTemplateHistorySummaryRows(
  rows: TemplateHistorySummaryRow[],
): TemplateHistorySummary[] {
  const summaries = new Map<string, TemplateHistorySummary>();

  for (const row of rows) {
    if (!row.template || !row.template_id) {
      continue;
    }

    const existing = summaries.get(row.template_id);

    if (existing) {
      existing.workoutCount += 1;
      continue;
    }

    summaries.set(row.template_id, {
      templateId: row.template_id,
      templateName: row.template.name,
      isArchived: row.template.is_archived,
      lastPerformedAt: row.started_at,
      workoutCount: 1,
    });
  }

  return [...summaries.values()];
}

export function mapExerciseHistorySummaryRows(
  rows: ExerciseHistorySummaryRow[],
): ExerciseHistorySummary[] {
  const summaries = new Map<string, ExerciseHistorySummary>();

  for (const row of rows) {
    const existing = summaries.get(row.exercise_id);

    if (existing) {
      existing.performanceCount += 1;
      continue;
    }

    summaries.set(row.exercise_id, {
      exerciseId: row.exercise_id,
      exerciseName: row.exercise_name_snapshot,
      lastPerformedAt: row.workoutSession.started_at,
      performanceCount: 1,
    });
  }

  return [...summaries.values()];
}

export function mapExerciseHistoryPerformanceRows(
  rows: ExerciseHistoryPerformanceRow[],
): ExerciseHistoryPerformance[] {
  return rows.map((row) => ({
    sessionExerciseId: row.id,
    workoutSessionId: row.workoutSession.id,
    templateId: row.workoutSession.template_id,
    templateName: row.workoutSession.template?.name ?? "Workout",
    sessionStatus: _toHistoricalStatus(row.workoutSession.status),
    startedAt: row.workoutSession.started_at,
    completedAt: row.workoutSession.completed_at,
    sets: _mapWorkingSetRows(row.sets),
  }));
}

export function mapWorkoutSessionRowToActiveWorkoutSummary(
  row: WorkoutSessionRowWithTemplate,
): ActiveWorkoutSummary {
  return {
    id: row.id,
    templateName: row.template?.name ?? "Workout",
    startedAt: row.started_at,
  };
}

export function mapWorkoutSessionRowsToWorkoutSession(
  sessionRow: WorkoutSessionRowWithTemplate,
  exerciseRows: WorkoutSessionExerciseRow[],
  setRows: WorkoutSetRow[],
  previousExerciseRows: PreviousWorkoutSessionExerciseRow[] = [],
  recommendationRows: ProgressionRecommendationRow[] = [],
  strengthRecords: PersistedStrengthRecord[] = [],
): WorkoutSession {
  const setsBySessionExerciseId = _groupSetsBySessionExerciseId(setRows);
  const recordsBySessionExerciseId =
    _groupRecordsBySessionExerciseId(strengthRecords);
  const recommendationBySessionExerciseId = new Map(
    recommendationRows.map((row) => [
      row.workout_session_exercise_id,
      mapProgressionRecommendationRow(row),
    ]),
  );
  const previousPerformanceByExerciseId = new Map(
    previousExerciseRows.map((row) => [
      row.exercise_id,
      _mapPreviousExercisePerformance(row),
    ]),
  );

  return {
    id: sessionRow.id,
    templateName: sessionRow.template?.name ?? "Workout",
    status: sessionRow.status,
    startedAt: sessionRow.started_at,
    completedAt: sessionRow.completed_at,
    exercises: exerciseRows.map((row) =>
      _mapWorkoutSessionExerciseRow(
        row,
        setsBySessionExerciseId.get(row.id) ?? [],
        previousPerformanceByExerciseId.get(row.exercise_id) ?? null,
        recommendationBySessionExerciseId.get(row.id) ?? null,
        recordsBySessionExerciseId.get(row.id) ?? [],
      ),
    ),
  };
}

export function mapWorkoutSetRowToWorkoutSet(row: WorkoutSetRow): WorkoutSet {
  return {
    id: row.id,
    position: row.position,
    reps: row.reps,
    weightValue: row.weight_value,
    weightUnit: row.weight_unit,
    normalizedWeightLbs: row.normalized_weight_lbs,
    rir: row.rir,
    performedAt: row.performed_at,
  };
}

function _mapWorkoutHistorySessionRow(
  row: WorkoutHistorySessionRow,
): WorkoutHistorySession {
  return {
    id: row.id,
    templateId: row.template_id,
    templateName: row.template?.name ?? "Workout",
    status: _toHistoricalStatus(row.status),
    startedAt: row.started_at,
    completedAt: row.completed_at,
    exercises: [...row.exercises]
      .sort((left, right) => left.position - right.position)
      .map(_mapWorkoutHistoryExerciseRow),
  };
}

function _mapWorkoutHistoryExerciseRow(
  row: WorkoutHistorySessionExerciseRow,
): WorkoutHistoryExercise {
  return {
    sessionExerciseId: row.id,
    exerciseId: row.exercise_id,
    exerciseName: row.exercise_name_snapshot,
    position: row.position,
    sets: _mapWorkingSetRows(row.sets),
  };
}

function _mapWorkoutSessionExerciseRow(
  row: WorkoutSessionExerciseRow,
  sets: WorkoutSet[],
  previousPerformance: PreviousExercisePerformance | null,
  recommendation: WorkoutSessionExercise["recommendation"],
  records: PersistedStrengthRecord[],
): WorkoutSessionExercise {
  return {
    id: row.id,
    exerciseId: row.exercise_id,
    exerciseName: row.exercise_name_snapshot,
    position: row.position,
    targetSets: row.target_sets,
    minReps: row.min_reps,
    maxReps: row.max_reps,
    plannedWeightValue: row.planned_weight_value,
    plannedWeightUnit: row.planned_weight_unit,
    plannedNormalizedWeightLbs: row.planned_normalized_weight_lbs,
    weightIncrementLbs: row.weight_increment_lbs,
    previousPerformance,
    recommendation,
    records,
    sets,
  };
}

function _mapPreviousExercisePerformance(
  row: PreviousWorkoutSessionExerciseRow,
): PreviousExercisePerformance {
  return {
    workoutSessionId: row.workout_session_id,
    workoutSessionExerciseId: row.id,
    startedAt: row.workoutSession.started_at,
    sets: row.sets.map(mapWorkoutSetRowToWorkoutSet),
  };
}

function _groupSetsBySessionExerciseId(
  rows: WorkoutSetRow[],
): Map<string, WorkoutSet[]> {
  const groups = new Map<string, WorkoutSet[]>();

  for (const row of rows) {
    const group = groups.get(row.workout_session_exercise_id) ?? [];

    group.push(mapWorkoutSetRowToWorkoutSet(row));
    groups.set(row.workout_session_exercise_id, group);
  }

  return groups;
}

function _groupRecordsBySessionExerciseId(
  records: PersistedStrengthRecord[],
): Map<string, PersistedStrengthRecord[]> {
  const groups = new Map<string, PersistedStrengthRecord[]>();

  for (const record of records) {
    const group = groups.get(record.workoutSessionExerciseId) ?? [];

    group.push(record);
    groups.set(record.workoutSessionExerciseId, group);
  }

  for (const group of groups.values()) {
    group.sort((left, right) => left.type.localeCompare(right.type));
  }

  return groups;
}

function _mapWorkingSetRows(rows: WorkoutSetRow[]): WorkoutSet[] {
  return rows
    .filter((row) => row.kind === "working")
    .sort((left, right) => left.position - right.position)
    .map(mapWorkoutSetRowToWorkoutSet);
}

function _toHistoricalStatus(
  status: WorkoutSessionRow["status"],
): "completed" | "cancelled" {
  if (status === "in_progress") {
    throw new Error("Active sessions cannot be mapped into workout history.");
  }

  return status;
}
