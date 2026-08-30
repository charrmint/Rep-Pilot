import type { Exercise, ExerciseRow } from "./types";

export function mapExerciseRowToExercise(row: ExerciseRow): Exercise {
  return {
    id: row.id,
    name: row.name,
    isArchived: row.is_archived,
    isSystemExercise: row.user_id === null,
  };
}
