import type { StrengthSet } from "./types";

export function calculateSetVolume(set: StrengthSet): number {
  if (!isValidStrengthSet(set)) {
    return 0;
  }

  return set.weight * set.reps;
}

export function calculateTotalVolume(sets: StrengthSet[]): number {
  return sets.reduce((total, set) => total + calculateSetVolume(set), 0);
}

export function calculateEpleyOneRepMax(set: StrengthSet): number | null {
  if (!isValidStrengthSet(set)) {
    return null;
  }

  if (set.reps > 12) {
    return null;
  }

  if (set.reps === 1) {
    return set.weight;
  }

  return set.weight * (1 + set.reps / 30);
}

export function isValidStrengthSet(set: StrengthSet): boolean {
  return (
    Number.isFinite(set.weight) &&
    set.weight > 0 &&
    Number.isFinite(set.reps) &&
    Number.isInteger(set.reps) &&
    set.reps > 0
  );
}
