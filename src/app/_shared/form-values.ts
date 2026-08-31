import type { WeightUnit } from "@/lib/units/types";

export function readStringFormValue(formData: FormData, name: string): string {
  const value = formData.get(name);

  return typeof value === "string" ? value : "";
}

export function readNumberFormValue(formData: FormData, name: string): number {
  const value = Number(readStringFormValue(formData, name));

  return Number.isFinite(value) ? value : Number.NaN;
}

export function readWeightUnitFormValue(
  formData: FormData,
  name: string,
): WeightUnit {
  const value = readStringFormValue(formData, name);

  if (!_isWeightUnit(value)) {
    throw new Error("Weight unit must be lb or kg.");
  }

  return value;
}

function _isWeightUnit(value: string): value is WeightUnit {
  return value === "lb" || value === "kg";
}
