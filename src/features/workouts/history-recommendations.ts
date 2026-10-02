import { listProgressionRecommendationRows } from "../progression/progression-queries";
import { mapProgressionRecommendationRow } from "../progression/progression-mappers";
import type { HistoryRecommendations } from "./types";

export async function getHistoryRecommendations(userId: string, sessionExerciseIds: string[]): Promise<HistoryRecommendations> {
  if (!sessionExerciseIds.length) return {};
  const rows = await listProgressionRecommendationRows({ userId, sessionExerciseIds: [...new Set(sessionExerciseIds)] });
  return Object.fromEntries(rows.map(row => [row.workout_session_exercise_id, mapProgressionRecommendationRow(row)]));
}
