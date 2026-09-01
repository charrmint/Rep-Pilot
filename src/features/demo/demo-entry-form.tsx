"use client";

import { useActionState } from "react";

import { INITIAL_FORM_ACTION_STATE } from "@/app/_shared/form-action-state";

import { startDemoAction } from "./demo-actions";

export function DemoEntryForm() {
  const [state, formAction, isPending] = useActionState(
    startDemoAction,
    INITIAL_FORM_ACTION_STATE,
  );

  return (
    <form action={formAction} className="w-full">
      <button
        type="submit"
        disabled={isPending}
        className="min-h-12 w-full rounded-md bg-gray-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isPending ? "Preparing demo..." : "Start demo"}
      </button>

      {state.message ? (
        <p className="mt-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.message}
        </p>
      ) : null}
    </form>
  );
}
