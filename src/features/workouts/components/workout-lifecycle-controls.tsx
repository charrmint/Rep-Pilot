"use client";

import { unstable_rethrow } from "next/navigation";
import { useState, useTransition } from "react";

import {
  cancelWorkoutAction,
  finishWorkoutAction,
} from "../workout-actions";

type WorkoutLifecycleIntent = "finish" | "cancel" | null;

interface WorkoutLifecycleControlsProps {
  sessionId: string;
  canFinish: boolean;
}

export function WorkoutLifecycleControls({
  sessionId,
  canFinish,
}: WorkoutLifecycleControlsProps) {
  const [intent, setIntent] = useState<WorkoutLifecycleIntent>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function _confirmIntent() {
    startTransition(async () => {
      try {
        if (intent === "finish") {
          await finishWorkoutAction(sessionId);
        }

        if (intent === "cancel") {
          await cancelWorkoutAction(sessionId);
        }
      } catch (error) {
        unstable_rethrow(error);
        setErrorMessage("Workout could not be updated. Try again.");
      }
    });
  }

  if (intent) {
    const isFinishing = intent === "finish";

    return (
      <section className="rounded-md border border-amber-200 bg-amber-50 p-4">
        <p className="font-semibold text-amber-950">
          {isFinishing ? "Finish this workout?" : "Abandon this workout?"}
        </p>
        <p className="mt-1 text-sm text-amber-800">
          {isFinishing
            ? "Logged sets will be saved and the workout will become read-only."
            : "Logged sets will remain saved, but this workout will be marked cancelled."}
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            disabled={isPending}
            onClick={_confirmIntent}
            className="min-h-11 rounded-md bg-amber-900 px-4 text-sm font-semibold text-white disabled:opacity-60"
          >
            {isPending
              ? "Saving..."
              : isFinishing
                ? "Finish workout"
                : "Abandon workout"}
          </button>
          <button
            type="button"
            disabled={isPending}
            onClick={() => setIntent(null)}
            className="min-h-11 px-3 text-sm font-semibold text-amber-900"
          >
            Keep working out
          </button>
        </div>
        {errorMessage ? (
          <p className="mt-2 text-sm text-red-700">{errorMessage}</p>
        ) : null}
      </section>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3">
      <button
        type="button"
        disabled={!canFinish}
        onClick={() => setIntent("finish")}
        className="min-h-12 rounded-md bg-green-700 px-4 text-sm font-semibold text-white transition hover:bg-green-600 disabled:cursor-not-allowed disabled:bg-gray-300"
      >
        Finish workout
      </button>
      <button
        type="button"
        onClick={() => setIntent("cancel")}
        className="min-h-12 rounded-md border border-red-200 px-4 text-sm font-semibold text-red-700 transition hover:bg-red-50"
      >
        Abandon workout
      </button>
    </div>
  );
}
