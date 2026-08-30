"use client";

import { useActionState } from "react";

import { setCustomExerciseArchiveStatusAction } from "./actions";
import { INITIAL_FORM_ACTION_STATE } from "./form-state";

interface ExerciseArchiveControlProps {
  exerciseId: string;
  isArchived: boolean;
}

export function ExerciseArchiveControl({
  exerciseId,
  isArchived,
}: ExerciseArchiveControlProps) {
  const [state, formAction, isPending] = useActionState(
    setCustomExerciseArchiveStatusAction,
    INITIAL_FORM_ACTION_STATE,
  );
  const nextIsArchived = !isArchived;

  return (
    <form action={formAction} className="flex flex-col items-end gap-2">
      <input type="hidden" name="exerciseId" value={exerciseId} />
      <input
        type="hidden"
        name="isArchived"
        value={String(nextIsArchived)}
      />
      <button
        type="submit"
        disabled={isPending}
        className="min-h-10 rounded-md border border-gray-300 px-3 text-sm font-semibold text-gray-700 transition hover:border-gray-400 hover:text-gray-950 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isPending ? "Saving..." : isArchived ? "Restore" : "Archive"}
      </button>
      {state.status === "error" && state.message ? (
        <p className="max-w-44 text-right text-xs text-red-700">
          {state.message}
        </p>
      ) : null}
    </form>
  );
}
