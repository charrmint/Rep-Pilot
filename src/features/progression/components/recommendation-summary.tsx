import type { ReactNode } from "react";

import { poundsToKilograms } from "@/lib/units/weight";
import type { WeightUnit } from "@/lib/units/types";

import type { PersistedProgressionRecommendation } from "../types";

interface RecommendationSummaryProps {
  recommendation: PersistedProgressionRecommendation;
  displayUnit: WeightUnit;
  targetSets: number;
  action?: ReactNode;
  label?: string;
  variant?: "default" | "compact";
}

const WEIGHT_FORMATTER = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 2,
});

export function RecommendationSummary({
  action,
  label = "Next session",
  recommendation,
  displayUnit,
  targetSets,
  variant = "default",
}: RecommendationSummaryProps) {
  const prescription = _getPrescription(recommendation);
  const repTarget = prescription
    ? prescription.minReps === prescription.maxReps
      ? `${prescription.minReps} reps`
      : `${prescription.minReps}-${prescription.maxReps} reps`
    : null;

  return (
    <section
      aria-label="Progression recommendation"
      className={`mt-4 rounded-md border border-blue-200 bg-blue-50 ${
        variant === "compact" ? "p-3" : "p-4"
      }`}
    >
      <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">
        {label}
      </p>
      <p className="mt-1 font-semibold text-blue-950">
        {_getRecommendationHeading(recommendation, displayUnit)}
      </p>
      {prescription ? (
        <p className="mt-1 text-sm font-medium text-blue-950">
          {targetSets} working sets · {repTarget} · approximately{" "}
          {prescription.rir} RIR
        </p>
      ) : null}
      <p className="mt-1 text-sm leading-6 text-blue-900">
        {recommendation.explanation}
      </p>
      {action ? <div className="mt-3">{action}</div> : null}
    </section>
  );
}

export function hasCompleteRecommendationPrescription(
  recommendation: PersistedProgressionRecommendation,
): boolean {
  return _getPrescription(recommendation) !== null;
}

function _getRecommendationHeading(
  recommendation: PersistedProgressionRecommendation,
  displayUnit: WeightUnit,
): string {
  const recommendedWeight = recommendation.recommendedWeightLbs;

  if (
    recommendation.action === "review" ||
    typeof recommendedWeight !== "number" ||
    !Number.isFinite(recommendedWeight)
  ) {
    return "Review before your next session";
  }

  const actionLabels = {
    increase: "Increase to",
    maintain: "Stay at",
    reduce: "Reduce to",
  } as const;
  const weight =
    displayUnit === "kg"
      ? poundsToKilograms(recommendedWeight)
      : recommendedWeight;

  return `${actionLabels[recommendation.action]} ${WEIGHT_FORMATTER.format(weight)} ${displayUnit}`;
}

function _getPrescription(
  recommendation: PersistedProgressionRecommendation,
): { minReps: number; maxReps: number; rir: number } | null {
  const minReps = recommendation.recommendedMinReps;
  const maxReps = recommendation.recommendedMaxReps;
  const rir = recommendation.recommendedRir;

  if (
    typeof minReps !== "number" ||
    !Number.isFinite(minReps) ||
    typeof maxReps !== "number" ||
    !Number.isFinite(maxReps) ||
    typeof rir !== "number" ||
    !Number.isFinite(rir)
  ) {
    return null;
  }

  return {
    minReps,
    maxReps,
    rir,
  };
}
