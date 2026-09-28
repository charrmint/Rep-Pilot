import type { ExerciseContextProps } from "./types";
import { LocalDateTime } from "@/features/workouts/components/local-date-time";
import { Button, Card } from "../ui/primitives";
import { hasCompleteRecommendationPrescription } from "@/features/progression/components/recommendation-summary";
import { poundsToKilograms } from "@/lib/units/weight";

export function ExerciseContext({
  exercise,
  disabled,
  onApply,
}: ExerciseContextProps) {
  const previous = exercise.previousPerformance;
  const suggestion = previous?.recommendation;
  const weight = suggestion?.recommendedWeightLbs;
  const actionable =
    suggestion &&
    suggestion.action !== "review" &&
    typeof weight === "number" &&
    Number.isFinite(weight) &&
    hasCompleteRecommendationPrescription(suggestion);
  const displayWeight =
    typeof weight === "number" && Number.isFinite(weight)
      ? Number(
          (exercise.plannedWeightUnit === "kg"
            ? poundsToKilograms(weight)
            : weight
          ).toFixed(2),
        )
      : null;
  const sets = [...(previous?.sets ?? [])].sort((left, right) => left.position - right.position);
  const first = sets[0];
  const sameLoad = first && sets.every((set) => set.weightValue === first.weightValue && set.weightUnit === first.weightUnit);
  return (
    <Card className="v2-workout-context">
      <div className="v2-previous-summary">
        <h2>Last time</h2>
        {previous ? (
          <>
            <p className="v2-muted">
              <LocalDateTime value={previous.startedAt} dateStyle="medium" />
            </p>
            <p className="v2-previous-highlight">
              {sameLoad ? `${first.weightValue} ${first.weightUnit} · ${sets.map((set) => set.reps).join(", ")} reps`
                : sets.length ? `${sets.length} saved sets · varied weights or units` : "No previous completed sets."}
            </p>
            {sets.length > 0 && <details>
              <summary>View previous sets ({sets.length})</summary>
              <ul className="v2-previous-sets">
              {sets.map((set) => (
                <li key={set.id}>
                  Set {set.position}: {set.weightValue} {set.weightUnit} ×{" "}
                  {set.reps}
                  {set.rir !== null && ` · ${set.rir} RIR`}
                </li>
              ))}
            </ul>
            </details>}
          </>
        ) : (
          <p className="v2-muted">No previous completed sets.</p>
        )}
      </div>
      {suggestion && (
        <div className="v2-context-suggestion">
          <p className="v2-eyebrow">Suggested from last workout</p>
          <h2>
            {suggestion.action === "review" || displayWeight === null
              ? "Review before your next session"
              : `${suggestion.action === "increase" ? "Increase to" : suggestion.action === "reduce" ? "Reduce to" : "Stay at"} ${displayWeight} ${exercise.plannedWeightUnit}`}
          </h2>
          <details>
            <summary>Why this suggestion?</summary>
          {hasCompleteRecommendationPrescription(suggestion) && (
            <p className="v2-muted">
              {suggestion.recommendedMinReps}–{suggestion.recommendedMaxReps}{" "}
              reps · approximately {suggestion.recommendedRir} RIR
            </p>
          )}
            <p>{suggestion.explanation}</p>
          </details>
          {actionable && displayWeight !== null && (
            <Button
              variant="secondary"
              disabled={disabled}
              onClick={() => onApply(String(displayWeight))}
            >
              Use suggested weight
            </Button>
          )}
        </div>
      )}
    </Card>
  );
}
