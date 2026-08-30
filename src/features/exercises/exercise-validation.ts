const CUSTOM_EXERCISE_NAME_MAX_LENGTH = 80;

export function normalizeCustomExerciseName(name: string): string {
  return name.trim().replace(/\s+/g, " ");
}

export function validateCustomExerciseName(name: string): string {
  const normalizedName = name.trim().replace(/\s+/g, " ");

  if (normalizedName.length === 0) {
    throw new Error("Exercise name is required.");
  }

  if (normalizedName.length > CUSTOM_EXERCISE_NAME_MAX_LENGTH) {
    throw new Error(
      `Exercise name must be ${CUSTOM_EXERCISE_NAME_MAX_LENGTH} characters or fewer.`,
    );
  }

  return normalizedName;
}
