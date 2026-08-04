import { StrengthSet } from "./types";

export function calculateSetVolume(set: StrengthSet): number {
    return set.weight * set.reps
}

export function calculateTotalVolume(sets: StrengthSet[]): number {
    return sets.reduce((total, set) => total + calculateSetVolume(set), 0);
}

export function calculateEpleyOneRepMax(set: StrengthSet): number | null {
    if (set.reps <= 0 || set.weight <=0) {
        return null;
    }

    //TODO: consider folding this into below logic, keeping 12 as max value for onerepmax
    if (set.reps > 12) {
        return null;
    }

    return set.weight * (1 + set.reps / 30);
}
