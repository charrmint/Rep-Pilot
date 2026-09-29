import type { WorkoutTemplateExerciseConfigInput } from "@/features/templates/types";
import type { PlanExerciseDraft } from "./types";

export function toExerciseDraft(config: WorkoutTemplateExerciseConfigInput): PlanExerciseDraft {
  return {
    targetSets: String(config.targetSets),
    minReps: String(config.minReps),
    maxReps: String(config.maxReps),
    defaultWeightValue: String(config.defaultWeightValue),
    defaultWeightUnit: config.defaultWeightUnit,
    weightIncrementLbs: String(config.weightIncrementLbs),
  };
}

export function sameExerciseDraft(left: PlanExerciseDraft, right: PlanExerciseDraft): boolean {
  return (Object.keys(left) as (keyof PlanExerciseDraft)[]).every((key) => left[key] === right[key]);
}
