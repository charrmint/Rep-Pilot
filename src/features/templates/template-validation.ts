const WORKOUT_TEMPLATE_NAME_MAX_LENGTH = 80;

export function normalizeWorkoutTemplateName(name: string): string {
  return name.trim().replace(/\s+/g, " ");
}

export function validateWorkoutTemplateName(name: string): string {
  const normalizedName = normalizeWorkoutTemplateName(name);

  if (normalizedName.length === 0) {
    throw new Error("Template name is required.");
  }

  if (normalizedName.length > WORKOUT_TEMPLATE_NAME_MAX_LENGTH) {
    throw new Error(
      `Template name must be ${WORKOUT_TEMPLATE_NAME_MAX_LENGTH} characters or fewer.`,
    );
  }

  return normalizedName;
}
