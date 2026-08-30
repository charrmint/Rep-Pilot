import { mapExerciseRowToExercise } from "./exercise-mappers";
import { listAvailableExerciseRows } from "./exercise-queries";
import type { Exercise } from "./types";

export async function listAvailableExercises(): Promise<Exercise[]> {
  const rows = await listAvailableExerciseRows();

  return rows.map(mapExerciseRowToExercise);
}
