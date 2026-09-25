import type { WorkoutSessionExercise } from "@/features/workouts/types";
import { poundsToKilograms } from "@/lib/units/weight";
import type { SetDraft } from "./types";

export function nextPlannedPosition(
  exercise: WorkoutSessionExercise,
): number | null {
  for (let position = 1; position <= exercise.targetSets; position++) {
    if (!exercise.sets.some((set) => set.position === position))
      return position;
  }
  return null;
}

export function createDraft(
  exercise: WorkoutSessionExercise,
  position: number,
): SetDraft {
  const saved = exercise.sets.find((set) => set.position === position);
  const previous = exercise.sets
    .filter((set) => set.position < position)
    .sort((a, b) => b.position - a.position)[0];
  const weight = previous
    ? exercise.plannedWeightUnit === "kg"
      ? poundsToKilograms(previous.normalizedWeightLbs)
      : previous.normalizedWeightLbs
    : exercise.plannedWeightValue;
  return {
    weight: String(saved?.weightValue ?? Number(weight.toFixed(2))),
    reps: saved ? String(saved.reps) : "",
    rir: saved?.rir ?? null,
    unit: saved?.weightUnit ?? exercise.plannedWeightUnit,
    dirty: false,
  };
}

export function plannedSetCount(exercise: WorkoutSessionExercise): number {
  return new Set(
    exercise.sets
      .filter((set) => set.position <= exercise.targetSets)
      .map((set) => set.position),
  ).size;
}
