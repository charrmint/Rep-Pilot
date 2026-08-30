import { mapExerciseRowToExercise } from "./exercise-mappers";
import {
  createCustomExerciseRow,
  listAvailableExerciseRows,
  listExerciseLibraryRows,
  updateCustomExerciseArchiveStatusRow,
} from "./exercise-queries";
import type {
  CreateCustomExerciseInput,
  Exercise,
  ExerciseRow,
  ExerciseLibrary,
  SetCustomExerciseArchiveStatusInput,
} from "./types";
import {
  normalizeCustomExerciseName,
  validateCustomExerciseName,
} from "./exercise-validation";

export async function listAvailableExercises(): Promise<Exercise[]> {
  const rows = await listAvailableExerciseRows();

  return rows.map(mapExerciseRowToExercise);
}

export async function listExerciseLibrary(): Promise<ExerciseLibrary> {
  const rows = await listExerciseLibraryRows();
  const exercises = rows.map(mapExerciseRowToExercise);

  return {
    activeExercises: exercises.filter((exercise) => !exercise.isArchived),
    archivedCustomExercises: exercises.filter(
      (exercise) => exercise.isArchived && !exercise.isSystemExercise,
    ),
  };
}

export async function createCustomExercise({
  userId,
  name,
}: CreateCustomExerciseInput): Promise<Exercise> {
  const normalizedName = validateCustomExerciseName(name);
  const rows = await listExerciseLibraryRows();

  if (_hasExerciseNameMatch(rows, normalizedName)) {
    throw new Error("An exercise with this name already exists.");
  }

  const row = await createCustomExerciseRow({
    user_id: userId,
    name: normalizedName,
  });

  return mapExerciseRowToExercise(row);
}

function _hasExerciseNameMatch(rows: ExerciseRow[], name: string): boolean {
  const normalizedName = normalizeCustomExerciseName(name).toLowerCase();

  return rows.some((row) => {
    return (
      normalizeCustomExerciseName(row.name).toLowerCase() === normalizedName
    );
  });
}

export async function setCustomExerciseArchiveStatus(
  input: SetCustomExerciseArchiveStatusInput,
): Promise<Exercise> {
  const row = await updateCustomExerciseArchiveStatusRow(input);

  return mapExerciseRowToExercise(row);
}
