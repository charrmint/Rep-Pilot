import { normalizeWeightToPounds } from "@/lib/units/weight";

import type {
  WorkoutTemplateExerciseConfig,
  WorkoutTemplateExerciseConfigInput,
} from "./types";

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

export function validateWorkoutTemplateExerciseConfig(
  input: WorkoutTemplateExerciseConfigInput,
): WorkoutTemplateExerciseConfig {
  if (!Number.isInteger(input.targetSets) || input.targetSets <= 0) {
    throw new Error("Target sets must be a positive whole number.");
  }

  if (!Number.isInteger(input.minReps) || input.minReps <= 0) {
    throw new Error("Minimum reps must be a positive whole number.");
  }

  if (!Number.isInteger(input.maxReps) || input.maxReps <= 0) {
    throw new Error("Maximum reps must be a positive whole number.");
  }

  if (input.maxReps < input.minReps) {
    throw new Error("Maximum reps must be greater than or equal to minimum reps.");
  }

  if (!Number.isFinite(input.defaultWeightValue)) {
    throw new Error("Default weight must be a number.");
  }

  if (input.defaultWeightValue < 0) {
    throw new Error("Default weight cannot be negative.");
  }

  if (!Number.isFinite(input.weightIncrementLbs)) {
    throw new Error("Weight increment must be a number.");
  }

  if (input.weightIncrementLbs <= 0) {
    throw new Error("Weight increment must be greater than zero.");
  }

  return {
    ...input,
    defaultNormalizedWeightLbs: normalizeWeightToPounds(
      input.defaultWeightValue,
      input.defaultWeightUnit,
    ),
  };
}
