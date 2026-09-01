import type { WorkoutTemplateExerciseConfigInput } from "./types";

export const DEFAULT_WORKOUT_TEMPLATE_EXERCISE_CONFIG = {
  targetSets: 3,
  minReps: 8,
  maxReps: 12,
  defaultWeightValue: 0,
  defaultWeightUnit: "lb",
  weightIncrementLbs: 5,
} satisfies WorkoutTemplateExerciseConfigInput;
