"use client";

import Link from "next/link";
import { useState, useTransition } from "react";

import { startWorkoutAction } from "../workout-actions";
import type { ActiveWorkoutSummary } from "../types";

interface StartWorkoutControlProps {
  templateId: string;
  hasExercises: boolean;
  activeWorkout: ActiveWorkoutSummary | null;
}

export function StartWorkoutControl({
  templateId,
  hasExercises,
  activeWorkout,
}: StartWorkoutControlProps) {
  const [isConfirmingReplacement, setIsConfirmingReplacement] = useState(false);
  const [isPending, startTransition] = useTransition();

  function _startWorkout(activeSessionIdToCancel?: string) {
    startTransition(async () => {
      await startWorkoutAction({ templateId, activeSessionIdToCancel });
    });
  }

  if (!hasExercises) {
    return (
      <button
        type="button"
        disabled
        className="min-h-10 rounded-md bg-gray-200 px-3 py-2 text-sm font-semibold text-gray-500"
      >
        Add exercises first
      </button>
    );
  }

  if (isConfirmingReplacement && activeWorkout) {
    return (
      <div className="w-full rounded-md border border-amber-200 bg-amber-50 p-3 sm:max-w-sm">
        <p className="text-sm font-medium text-amber-950">
          Abandon {activeWorkout.templateName} and start this workout?
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            disabled={isPending}
            onClick={() => _startWorkout(activeWorkout.id)}
            className="min-h-10 rounded-md bg-amber-900 px-3 text-sm font-semibold text-white disabled:opacity-60"
          >
            {isPending ? "Starting..." : "Abandon and start"}
          </button>
          <Link
            href={`/workouts/${activeWorkout.id}`}
            className="min-h-10 rounded-md border border-amber-300 px-3 py-2 text-sm font-semibold text-amber-950"
          >
            Resume current
          </Link>
          <button
            type="button"
            disabled={isPending}
            onClick={() => setIsConfirmingReplacement(false)}
            className="min-h-10 px-2 text-sm font-semibold text-amber-800"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <button
      type="button"
      disabled={isPending}
      onClick={() => {
        if (activeWorkout) {
          setIsConfirmingReplacement(true);
          return;
        }

        _startWorkout();
      }}
      className="min-h-10 rounded-md bg-blue-700 px-3 py-2 text-sm font-semibold text-white transition hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {isPending ? "Starting..." : "Start workout"}
    </button>
  );
}
