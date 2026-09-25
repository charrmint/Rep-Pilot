import type { WorkoutSessionExercise } from "@/features/workouts/types";
import { LocalDateTime } from "@/features/workouts/components/local-date-time";
import { Button, Card } from "../ui/primitives";
import { hasCompleteRecommendationPrescription } from "@/features/progression/components/recommendation-summary";
import { poundsToKilograms } from "@/lib/units/weight";

export function ExerciseContext({
  exercise,
  disabled,
  onApply,
}: {
  exercise: WorkoutSessionExercise;
  disabled: boolean;
  onApply: (weight: string) => void;
}) {
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
  return (
    <div className="v2-workout-context">
      <Card>
        <h2>Last time</h2>
        {previous ? (
          <>
            <p className="v2-muted">
              <LocalDateTime value={previous.startedAt} dateStyle="medium" />
            </p>
            <ul className="v2-previous-sets">
              {previous.sets.map((set) => (
                <li key={set.id}>
                  Set {set.position}: {set.weightValue} {set.weightUnit} ×{" "}
                  {set.reps}
                  {set.rir !== null && ` · ${set.rir} RIR`}
                </li>
              ))}
            </ul>
          </>
        ) : (
          <p className="v2-muted">No previous completed sets.</p>
        )}
      </Card>
      {suggestion && (
        <Card>
          <p className="v2-eyebrow">Suggested from last workout</p>
          <h2>
            {suggestion.action === "review" || displayWeight === null
              ? "Review before your next session"
              : `${suggestion.action === "increase" ? "Increase to" : suggestion.action === "reduce" ? "Reduce to" : "Stay at"} ${displayWeight} ${exercise.plannedWeightUnit}`}
          </h2>
          {hasCompleteRecommendationPrescription(suggestion) && (
            <p className="v2-muted">
              {suggestion.recommendedMinReps}–{suggestion.recommendedMaxReps}{" "}
              reps · approximately {suggestion.recommendedRir} RIR
            </p>
          )}
          <details>
            <summary>Why this suggestion?</summary>
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
        </Card>
      )}
    </div>
  );
}
