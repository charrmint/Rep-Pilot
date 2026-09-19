import { filterValidWorkingStrengthSetRows } from "../records/strength-record-mappers";
import { prepareProgressionRecommendation } from "../progression/progression-mappers";
import type {
  PreparedProgressionRecommendation,
  RecentProgressionExerciseRow,
} from "../progression/types";
import type {
  DemoProgressionExerciseRow,
  DemoProgressionPerformance,
  DemoProgressionRecommendationInsert,
} from "./types";

export function prepareDemoProgressionRecommendations(
  rows: DemoProgressionExerciseRow[],
): PreparedProgressionRecommendation[] {
  const performancesByExerciseId = new Map<
    string,
    DemoProgressionPerformance[]
  >();

  for (const row of rows) {
    const performance = _toEligibleDemoProgressionPerformance(row);

    if (!performance) {
      continue;
    }

    const exerciseId = performance.exerciseRow.exercise_id;
    const performances = performancesByExerciseId.get(exerciseId) ?? [];
    performances.push(performance);
    performancesByExerciseId.set(exerciseId, performances);
  }

  return [...performancesByExerciseId.values()]
    .map(_prepareLatestDemoProgressionRecommendation)
    .filter(
      (
        recommendation,
      ): recommendation is PreparedProgressionRecommendation =>
        recommendation !== null,
    );
}

export function mapDemoProgressionRecommendationInsertRows({
  userId,
  recommendations,
}: {
  userId: string;
  recommendations: PreparedProgressionRecommendation[];
}): DemoProgressionRecommendationInsert[] {
  return recommendations.map((recommendation) => ({
    user_id: userId,
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
  }));
}

function _toEligibleDemoProgressionPerformance(
  row: DemoProgressionExerciseRow,
): DemoProgressionPerformance | null {
  if (row.workoutSession.status !== "completed") {
    return null;
  }

  const { workoutSession, sets, ...exerciseRow } = row;
  const validWorkingSets = filterValidWorkingStrengthSetRows(sets);

  if (validWorkingSets.length === 0) {
    return null;
  }

  return {
    exerciseRow,
    workoutSession,
    sets: validWorkingSets,
  };
}

function _prepareLatestDemoProgressionRecommendation(
  performances: DemoProgressionPerformance[],
): PreparedProgressionRecommendation | null {
  const sortedPerformances = [...performances].sort(
    _compareDemoProgressionPerformanceAsc,
  );
  const latestPerformance =
    sortedPerformances[sortedPerformances.length - 1];

  if (!latestPerformance) {
    return null;
  }

  const previousPerformances = sortedPerformances.slice(
    Math.max(0, sortedPerformances.length - 3),
    sortedPerformances.length - 1,
  );

  return prepareProgressionRecommendation({
    exerciseRow: latestPerformance.exerciseRow,
    setRows: latestPerformance.sets,
    recentExerciseRows: previousPerformances.map(
      _toRecentProgressionExerciseRow,
    ),
  });
}

function _toRecentProgressionExerciseRow(
  performance: DemoProgressionPerformance,
): RecentProgressionExerciseRow {
  return {
    id: performance.exerciseRow.id,
    exercise_id: performance.exerciseRow.exercise_id,
    workout_session_id: performance.exerciseRow.workout_session_id,
    target_sets: performance.exerciseRow.target_sets,
    min_reps: performance.exerciseRow.min_reps,
    workoutSession: {
      started_at: performance.workoutSession.started_at,
    },
    sets: performance.sets,
  };
}

function _compareDemoProgressionPerformanceAsc(
  left: DemoProgressionPerformance,
  right: DemoProgressionPerformance,
): number {
  const startedAtDifference =
    Date.parse(left.workoutSession.started_at) -
    Date.parse(right.workoutSession.started_at);

  if (startedAtDifference !== 0) {
    return startedAtDifference;
  }

  return left.exerciseRow.id.localeCompare(right.exerciseRow.id);
}
