"use client";

import { useEffect, useRef } from "react";
import { LocalDateTime } from "@/features/workouts/components/local-date-time";
import { getWorkoutDurationLabel } from "@/features/workouts/workout-history";
import { StrengthRecordSummary } from "@/features/records/components/strength-record-summary";
import { RecommendationSummary } from "@/features/progression/components/recommendation-summary";
import { ButtonLink, Card } from "../ui/primitives";
import { plannedSetCount } from "./editor-state";
import type { WorkoutResultsProps } from "./types";

export function WorkoutResults({ workout }: WorkoutResultsProps) {
  const results = useRef<HTMLDivElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const completed = workout.status === "completed";
  const duration = completed ? getWorkoutDurationLabel(workout) : null;
  const logged = workout.exercises.reduce(
    (sum, exercise) => sum + exercise.sets.length,
    0,
  );
  const planned = workout.exercises.reduce(
    (sum, exercise) => sum + exercise.targetSets,
    0,
  );
  const plannedLogged = workout.exercises.reduce(
    (sum, exercise) => sum + plannedSetCount(exercise),
    0,
  );
  useEffect(() => {
    heading.current?.focus({ preventScroll: true });
    results.current?.scrollIntoView?.({ block: "start" });
  }, []);
  return (
    <div ref={results} className="v2-workout-results">
      <ButtonLink href="/v2" variant="quiet">
        ← Today
      </ButtonLink>
      <Card className="v2-hero">
        <p className="v2-eyebrow">
          {completed ? "Session complete" : "Session abandoned"}
        </p>
        <h1 ref={heading} tabIndex={-1}>
          {completed ? "Workout complete" : "Workout abandoned"}
        </h1>
        <h2>{workout.templateName}</h2>
        <p>
          {completed
            ? "Your work is saved. Here’s what to build on next time."
            : "Your logged sets are saved. No new records or recommendations were generated."}
        </p>
        <p>
          Started <LocalDateTime value={workout.startedAt} dateStyle="medium" />
          {completed && workout.completedAt && (
            <>
              {" "}
              · Finished{" "}
              <LocalDateTime value={workout.completedAt} dateStyle="medium" />
            </>
          )}
        </p>
        <dl className="v2-result-metrics">
          <div>
            <dt>Sets logged</dt>
            <dd>{logged}</dd>
          </div>
          <div>
            <dt>Planned sets logged</dt>
            <dd>
              {plannedLogged} / {planned}
            </dd>
          </div>
          {duration && (
            <div>
              <dt>Duration</dt>
              <dd>{duration}</dd>
            </div>
          )}
        </dl>
      </Card>
      <div className="v2-section-heading">
        <h2>Session details</h2>
        <span className="v2-chip">Read-only</span>
      </div>
      {workout.exercises.length === 0 && (
        <Card>
          <p className="v2-muted">No exercises were recorded.</p>
        </Card>
      )}
      {workout.exercises.map((exercise) => (
        <Card key={exercise.id} className="v2-result-exercise">
          <p className="v2-eyebrow">Exercise {exercise.position}</p>
          <h2>{exercise.exerciseName}</h2>
          <p className="v2-muted">
            {exercise.targetSets} planned sets · {exercise.minReps}–
            {exercise.maxReps} reps
          </p>
          {exercise.sets.length ? (
            <ol className="v2-saved-sets">
              {exercise.sets.map((set) => (
                <li key={set.id}>
                  <div>
                    <strong>
                      Set {set.position}
                      {set.position > exercise.targetSets ? " · Extra" : ""}
                    </strong>
                    <span>
                      {set.weightValue} {set.weightUnit} × {set.reps}
                      {set.rir === null
                        ? ""
                        : ` · ${set.rir >= 3 ? "3+" : set.rir} RIR`}
                    </span>
                  </div>
                </li>
              ))}
            </ol>
          ) : (
            <p className="v2-muted">No sets logged.</p>
          )}
          {completed && (
            <div className="v2-result-insights">
              <StrengthRecordSummary
                records={exercise.records}
                displayUnit={exercise.plannedWeightUnit}
              />
              {exercise.recommendation && (
                <RecommendationSummary
                  recommendation={exercise.recommendation}
                  displayUnit={exercise.plannedWeightUnit}
                  targetSets={exercise.targetSets}
                />
              )}
            </div>
          )}
        </Card>
      ))}
      <div className="v2-actions">
        <ButtonLink href="/v2">Back to Today</ButtonLink>
        <ButtonLink variant="secondary" href="/v2/library">
          Choose a plan
        </ButtonLink>
      </div>
    </div>
  );
}
