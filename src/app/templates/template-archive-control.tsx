"use client";

import { useActionState } from "react";

import { INITIAL_FORM_ACTION_STATE } from "../_shared/form-action-state";
import { setWorkoutTemplateArchiveStatusAction } from "./actions";

interface TemplateArchiveControlProps {
  templateId: string;
  isArchived: boolean;
}

export function TemplateArchiveControl({
  templateId,
  isArchived,
}: TemplateArchiveControlProps) {
  const [state, formAction, isPending] = useActionState(
    setWorkoutTemplateArchiveStatusAction,
    INITIAL_FORM_ACTION_STATE,
  );
  const nextIsArchived = !isArchived;

  return (
    <form action={formAction} className="flex flex-col items-end gap-2">
      <input type="hidden" name="templateId" value={templateId} />
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
