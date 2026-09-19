"use client";

import { type ComponentRef, useMemo, useRef, useState } from "react";

import { poundsToKilograms } from "@/lib/units/weight";

import type { WorkoutSessionExercise, WorkoutSet } from "../types";
import {
  hasCompleteRecommendationPrescription,
  RecommendationSummary,
} from "../../progression/components/recommendation-summary";
import { PreviousExercisePerformance } from "./previous-exercise-performance";
import { WorkoutSetRow } from "./workout-set-row";

interface WorkoutExerciseCardProps {
  exercise: WorkoutSessionExercise;
  onSetSaved: (exerciseId: string, set: WorkoutSet) => void;
  onSetDeleted: (exerciseId: string, set: WorkoutSet) => void;
}

export function WorkoutExerciseCard({
  exercise,
  onSetSaved,
  onSetDeleted,
}: WorkoutExerciseCardProps) {
  const [extraPositions, setExtraPositions] = useState<number[]>([]);
  const draftSetRowsRef = useRef(
    new Map<number, ComponentRef<typeof WorkoutSetRow>>(),
  );
  const positions = useMemo(
    () => _getSetPositions(exercise, extraPositions),
    [exercise, extraPositions],
  );
  const previousPerformance = exercise.previousPerformance;
  const previousRecommendation = previousPerformance?.recommendation ?? null;
  const suggestedWeightValue = previousRecommendation
    ? _getSuggestedWeightValue(
        previousRecommendation,
        exercise.plannedWeightUnit,
      )
    : null;
  const canApplySuggestedWeight =
    previousRecommendation !== null &&
    suggestedWeightValue !== null &&
    _isActionableWeightSuggestion(previousRecommendation);

  function _addSet() {
    const nextPosition = Math.max(...positions, 0) + 1;

    setExtraPositions((current) => [...current, nextPosition]);
  }

  function _handleSetDeleted(set: WorkoutSet) {
    if (set.position > exercise.targetSets) {
      setExtraPositions((current) =>
        current.filter((position) => position !== set.position),
      );
    }

    onSetDeleted(exercise.id, set);
  }

  function _applySuggestedWeight() {
    if (!suggestedWeightValue) {
      return;
    }

    for (const row of draftSetRowsRef.current.values()) {
      row.applySuggestedWeight(suggestedWeightValue);
    }
  }

  return (
    <article className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
            Exercise {exercise.position}
          </p>
          <h2 className="mt-1 truncate text-xl font-semibold text-gray-950">
            {exercise.exerciseName}
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            {exercise.targetSets} sets · {exercise.minReps}-{exercise.maxReps}{" "}
            reps · Planned {exercise.plannedWeightValue}{" "}
            {exercise.plannedWeightUnit}
          </p>
        </div>
        <span className="shrink-0 rounded-full bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-700">
          {exercise.sets.length}/{exercise.targetSets} logged
        </span>
      </div>

      {previousPerformance && previousRecommendation ? (
        <RecommendationSummary
          recommendation={previousRecommendation}
          displayUnit={exercise.plannedWeightUnit}
          targetSets={previousPerformance.targetSets}
          label="Suggested from last workout"
          variant="compact"
          action={
            canApplySuggestedWeight ? (
              <button
                type="button"
                onClick={_applySuggestedWeight}
                className="min-h-10 rounded-md bg-blue-700 px-3 text-sm font-semibold text-white transition hover:bg-blue-800"
              >
                Use suggested weight
              </button>
            ) : null
          }
        />
      ) : null}

      <PreviousExercisePerformance
        exerciseName={exercise.exerciseName}
        performance={exercise.previousPerformance}
      />

      <ol className="mt-4 flex flex-col gap-2">
        {positions.map((position) => {
          const workoutSet = exercise.sets.find(
            (set) => set.position === position,
          );
          const previousSet = exercise.sets.find(
            (set) => set.position === position - 1,
          );

          return (
            <WorkoutSetRow
              key={workoutSet?.id ?? `draft-${position}`}
              ref={
                workoutSet
                  ? undefined
                  : (row) => {
                      if (row) {
                        draftSetRowsRef.current.set(position, row);
                      } else {
                        draftSetRowsRef.current.delete(position);
                      }
                    }
              }
              sessionExerciseId={exercise.id}
              position={position}
              defaultWeightValue={
                previousSet?.weightValue ?? exercise.plannedWeightValue
              }
              weightUnit={
                workoutSet?.weightUnit ?? exercise.plannedWeightUnit
              }
              workoutSet={workoutSet}
              onSaved={(set) => onSetSaved(exercise.id, set)}
              onDeleted={_handleSetDeleted}
            />
          );
        })}
      </ol>

      <button
        type="button"
        onClick={_addSet}
        className="mt-3 min-h-11 w-full rounded-md border border-dashed border-gray-300 px-4 text-sm font-semibold text-gray-700 transition hover:border-gray-500 hover:text-gray-950"
      >
        Add another set
      </button>
    </article>
  );
}

function _getSetPositions(
  exercise: WorkoutSessionExercise,
  extraPositions: number[],
): number[] {
  const positions = new Set<number>();

  for (let position = 1; position <= exercise.targetSets; position += 1) {
    positions.add(position);
  }

  for (const set of exercise.sets) {
    positions.add(set.position);
  }

  for (const position of extraPositions) {
    positions.add(position);
  }

  return [...positions].sort((left, right) => left - right);
}

function _isActionableWeightSuggestion(
  recommendation: NonNullable<WorkoutSessionExercise["recommendation"]>,
): boolean {
  return (
    recommendation.action !== "review" &&
    _getRecommendedWeightLbs(recommendation) !== null &&
    hasCompleteRecommendationPrescription(recommendation)
  );
}

function _getSuggestedWeightValue(
  recommendation: NonNullable<WorkoutSessionExercise["recommendation"]>,
  displayUnit: WorkoutSessionExercise["plannedWeightUnit"],
): string | null {
  const recommendedWeightLbs = _getRecommendedWeightLbs(recommendation);

  if (recommendedWeightLbs === null) {
    return null;
  }

  const displayWeight =
    displayUnit === "kg"
      ? poundsToKilograms(recommendedWeightLbs)
      : recommendedWeightLbs;

  return String(Number(displayWeight.toFixed(2)));
}

function _getRecommendedWeightLbs(
  recommendation: NonNullable<WorkoutSessionExercise["recommendation"]>,
): number | null {
  return typeof recommendation.recommendedWeightLbs === "number" &&
    Number.isFinite(recommendation.recommendedWeightLbs)
    ? recommendation.recommendedWeightLbs
    : null;
}
