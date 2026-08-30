"use client";

import { useActionState, useEffect, useRef } from "react";

import { INITIAL_FORM_ACTION_STATE } from "../_shared/form-action-state";
import { createWorkoutTemplateAction } from "./actions";

export function CreateTemplateForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction, isPending] = useActionState(
    createWorkoutTemplateAction,
    INITIAL_FORM_ACTION_STATE,
  );

  useEffect(() => {
    if (state.status === "success") {
      formRef.current?.reset();
    }
  }, [state.status]);

  return (
    <form
      ref={formRef}
      action={formAction}
      className="rounded-md border border-gray-200 bg-white p-4 shadow-sm"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <label className="flex flex-1 flex-col gap-2 text-sm font-medium text-gray-800">
          Template name
          <input
            name="name"
            type="text"
            required
            maxLength={80}
            placeholder="Upper A"
            className="min-h-12 rounded-md border border-gray-300 px-3 text-base text-gray-950 outline-none transition focus:border-gray-950"
          />
        </label>

        <button
          type="submit"
          disabled={isPending}
          className="min-h-12 rounded-md bg-gray-950 px-4 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isPending ? "Creating..." : "Create template"}
        </button>
      </div>

      {state.message ? (
        <p
          className={`mt-3 rounded-md border px-3 py-2 text-sm ${
            state.status === "error"
              ? "border-red-200 bg-red-50 text-red-700"
              : "border-green-200 bg-green-50 text-green-700"
          }`}
        >
          {state.message}
        </p>
      ) : null}
    </form>
  );
}
