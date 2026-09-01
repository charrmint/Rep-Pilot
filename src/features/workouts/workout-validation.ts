import { normalizeWeightToPounds } from "@/lib/units/weight";

import type {
  SaveWorkoutSetInput,
  ValidatedWorkoutSetInput,
} from "./types";

export function validateWorkoutSetInput(
  input: SaveWorkoutSetInput,
): ValidatedWorkoutSetInput {
  if (!Number.isInteger(input.position) || input.position <= 0) {
    throw new Error("Set position must be a positive whole number.");
  }

  if (!Number.isInteger(input.reps) || input.reps < 0) {
    throw new Error("Reps must be a non-negative whole number.");
  }

  if (!Number.isFinite(input.weightValue) || input.weightValue < 0) {
    throw new Error("Weight must be a non-negative number.");
  }

  if (!_isWeightUnit(input.weightUnit)) {
    throw new Error("Weight unit must be lb or kg.");
  }

  return {
    ...input,
    normalizedWeightLbs: normalizeWeightToPounds(
      input.weightValue,
      input.weightUnit,
    ),
  };
}

function _isWeightUnit(value: string): value is "lb" | "kg" {
  return value === "lb" || value === "kg";
}
