"use client";

import { useActionState } from "react";

import { INITIAL_FORM_ACTION_STATE } from "@/app/_shared/form-action-state";

import type { DemoEntryFormProps } from "./types";
import { startDemoAction } from "./demo-actions";

export function DemoEntryForm({ secondary = false }: DemoEntryFormProps) {
  const [state, formAction, isPending] = useActionState(
    startDemoAction,
    INITIAL_FORM_ACTION_STATE,
  );

  return (
    <form aria-label="Start demo" aria-busy={isPending} action={formAction} className="v2-demo-form">
      <button
        type="submit"
        disabled={isPending}
        className={`v2-button v2-button--${secondary ? "secondary" : "primary"}`}
      >
        {isPending ? "Preparing demo..." : "Start demo"}
      </button>

      {state.message ? (
        <p role="alert" className="v2-auth-notice v2-auth-error">
          {state.message}
        </p>
      ) : null}
    </form>
  );
}
