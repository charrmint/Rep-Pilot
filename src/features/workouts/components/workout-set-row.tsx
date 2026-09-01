"use client";

import { useState, useTransition } from "react";

import {
  deleteWorkoutSetAction,
  saveWorkoutSetAction,
} from "../workout-actions";
import type { WorkoutSet } from "../types";

interface WorkoutSetRowProps {
  sessionExerciseId: string;
  position: number;
  defaultWeightValue: number;
  weightUnit: "lb" | "kg";
  workoutSet?: WorkoutSet;
  onSaved: (set: WorkoutSet) => void;
  onDeleted: (set: WorkoutSet) => void;
}

export function WorkoutSetRow({
  sessionExerciseId,
  position,
  defaultWeightValue,
  weightUnit,
  workoutSet,
  onSaved,
  onDeleted,
}: WorkoutSetRowProps) {
  const [weightValue, setWeightValue] = useState(
    String(workoutSet?.weightValue ?? defaultWeightValue),
  );
  const [reps, setReps] = useState(
    workoutSet ? String(workoutSet.reps) : "",
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function _saveSet() {
    startTransition(async () => {
      try {
        const savedSet = await saveWorkoutSetAction({
          sessionExerciseId,
          workoutSetId: workoutSet?.id,
          position,
          reps: Number(reps),
          weightValue: Number(weightValue),
          weightUnit,
        });

        setErrorMessage(null);
        onSaved(savedSet);
      } catch {
        setErrorMessage("Set could not be saved. Try again.");
      }
    });
  }

  function _deleteSet() {
    if (!workoutSet) {
      return;
    }

    startTransition(async () => {
      try {
        await deleteWorkoutSetAction({
          sessionExerciseId,
          workoutSetId: workoutSet.id,
        });

        setErrorMessage(null);
        onDeleted(workoutSet);
      } catch {
        setErrorMessage("Set could not be deleted. Try again.");
      }
    });
  }

  return (
    <li className="rounded-md border border-gray-200 bg-gray-50 p-3">
      <div className="grid grid-cols-[2rem_minmax(0,1fr)_minmax(0,1fr)] items-end gap-2 sm:grid-cols-[2rem_minmax(0,1fr)_minmax(0,1fr)_auto]">
        <span className="pb-3 text-center text-sm font-semibold text-gray-500">
          {position}
        </span>
        <label className="flex min-w-0 flex-col gap-1 text-xs font-medium text-gray-600">
          Weight ({weightUnit})
          <input
            type="number"
            required
            min={0}
            step="any"
            inputMode="decimal"
            value={weightValue}
            onChange={(event) => setWeightValue(event.target.value)}
            className="min-h-12 min-w-0 rounded-md border border-gray-300 bg-white px-3 text-base text-gray-950 outline-none focus:border-gray-950"
          />
        </label>
        <label className="flex min-w-0 flex-col gap-1 text-xs font-medium text-gray-600">
          Reps
          <input
            type="number"
            required
            min={0}
            step={1}
            inputMode="numeric"
            value={reps}
            onChange={(event) => setReps(event.target.value)}
            className="min-h-12 min-w-0 rounded-md border border-gray-300 bg-white px-3 text-base text-gray-950 outline-none focus:border-gray-950"
          />
        </label>
        <div className="col-start-2 col-span-2 flex gap-2 sm:col-auto sm:col-span-1">
          <button
            type="button"
            disabled={isPending || weightValue === "" || reps === ""}
            onClick={_saveSet}
            className="min-h-11 flex-1 rounded-md bg-gray-950 px-4 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50 sm:flex-none"
          >
            {isPending
              ? "Saving..."
              : workoutSet
                ? "Update set"
                : "Log set"}
          </button>
          {workoutSet ? (
            <button
              type="button"
              disabled={isPending}
              onClick={_deleteSet}
              aria-label={`Delete set ${position}`}
              className="min-h-11 rounded-md border border-red-200 px-3 text-sm font-semibold text-red-700 transition hover:bg-red-50 disabled:opacity-50"
            >
              Delete
            </button>
          ) : null}
        </div>
      </div>
      {errorMessage ? (
        <p className="mt-2 text-sm text-red-700">{errorMessage}</p>
      ) : null}
    </li>
  );
}
