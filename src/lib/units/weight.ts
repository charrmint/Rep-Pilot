export type WeightUnit = "lb" | "kg";

const KG_TO_LB = 2.2;
const WEIGHT_DECIMAL_PLACES = 2;

export function poundsToKilograms(pounds: number): number {
    return pounds / KG_TO_LB;
}

export function kilogramsToPounds(kilograms: number): number {
    return kilograms * KG_TO_LB;
}

export function normalizeWeightToPounds(value: number, unit: WeightUnit): number {
    if (unit === "lb") {
        return _roundWeight(value);
    }

    return _roundWeight(kilogramsToPounds(value));
}

export function roundToIncrement(value: number, increment: number): number {
    if (increment <= 0) {
        //TODO: define error type
        throw new Error("Increment must be greater than zero.");
    }

    const res = Math.round(value/increment) * increment;
    return Number(res.toFixed(WEIGHT_DECIMAL_PLACES));
}

function _roundWeight(value: number): number {
    return Number(value.toFixed(WEIGHT_DECIMAL_PLACES));
}
