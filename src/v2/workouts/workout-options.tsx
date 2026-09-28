"use client";

import { useRef } from "react";
import { Button } from "../ui/primitives";
import type { WorkoutOptionsProps } from "./types";

export function WorkoutOptions({ disabled, onAbandon }: WorkoutOptionsProps) {
  const details = useRef<HTMLDetailsElement>(null);
  const trigger = useRef<HTMLElement>(null);
  function _close() {
    if (details.current) details.current.open = false;
  }
  return (
    <details ref={details} className="v2-workout-options"
      onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) _close(); }}
      onKeyDown={(event) => {
        if (event.key === "Escape") { event.preventDefault(); _close(); trigger.current?.focus(); }
      }}>
      <summary ref={trigger} aria-label="Workout options"><svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><circle cx="5" cy="12" r="1.5" /><circle cx="12" cy="12" r="1.5" /><circle cx="19" cy="12" r="1.5" /></svg></summary>
      <div className="v2-workout-options-panel">
        <Button variant="quiet" className="v2-danger-action" disabled={disabled}
          onClick={() => { _close(); trigger.current?.focus(); onAbandon(); }}>Abandon workout</Button>
      </div>
    </details>
  );
}
