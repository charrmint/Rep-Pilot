"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Button } from "../ui/primitives";
import type { WorkoutConfirmationProps } from "./types";

export function WorkoutConfirmation({
  intent,
  logged,
  remaining,
  hasDrafts,
  canFinish,
  pending,
  unverified,
  error,
  onConfirm,
  onDismiss,
  onCheck,
}: WorkoutConfirmationProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const descriptionId = useId();
  const [discardConfirmed, setDiscardConfirmed] = useState(false);
  const finishing = intent === "finish";
  useEffect(() => {
    const dialog = dialogRef.current;
    dialog?.showModal();
    return () => dialog?.close();
  }, []);
  return (
    <dialog
      ref={dialogRef}
      className="v2-workout-dialog"
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
      onCancel={(event) => {
        event.preventDefault();
        if (!pending) onDismiss();
      }}
    >
      <h2 id={titleId}>
        {finishing ? "Finish this workout?" : "Abandon this workout?"}
      </h2>
      <p id={descriptionId}>
        {finishing
          ? `Your ${logged} logged ${logged === 1 ? "set will" : "sets will"} be kept and this workout will become read-only.`
          : "Your logged sets will stay saved. This workout will be marked abandoned and will not generate new records or recommendations."}
      </p>
      {finishing && remaining > 0 && (
        <p className="v2-confirm-note">
          {remaining} planned {remaining === 1 ? "set is" : "sets are"} still
          unlogged. You can finish a partial workout.
        </p>
      )}
      {finishing && !canFinish && (
        <p className="v2-error">
          Log at least one set with positive weight and reps before finishing.
        </p>
      )}
      {hasDrafts && (
        <label className="v2-discard-drafts">
          <input
            type="checkbox"
            checked={discardConfirmed}
            disabled={pending}
            onChange={(event) => setDiscardConfirmed(event.target.checked)}
          />
          <span>
            Discard unlogged changes in this workout. Only saved sets will be
            kept.
          </span>
        </label>
      )}
      {error && (
        <div className="v2-workout-error" role="alert">
          <p>{error}</p>
          {unverified && (
            <Button variant="secondary" disabled={pending} onClick={onCheck}>
              Check workout status
            </Button>
          )}
        </div>
      )}
      <div className="v2-actions">
        <Button
          variant="secondary"
          autoFocus
          disabled={pending}
          onClick={onDismiss}
        >
          Keep working out
        </Button>
        <Button
          disabled={
            pending ||
            unverified ||
            (finishing && !canFinish) ||
            (hasDrafts && !discardConfirmed)
          }
          onClick={onConfirm}
        >
          {pending
            ? "Checking workout…"
            : finishing
              ? "Confirm finish"
              : "Confirm abandon"}
        </Button>
      </div>
      {pending && (
        <p role="status">Please wait while we confirm your workout.</p>
      )}
    </dialog>
  );
}
