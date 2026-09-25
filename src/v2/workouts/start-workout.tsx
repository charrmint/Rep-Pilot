"use client";

import { useRef, useState, useTransition } from "react";
import { unstable_rethrow } from "next/navigation";
import { Button, ButtonLink } from "../ui/primitives";
import { startV2Workout } from "./actions";
import type { StartWorkoutProps } from "./types";

export function StartWorkout({
  templateId,
  hasExercises,
  activeWorkout,
}: StartWorkoutProps) {
  const [confirming, setConfirming] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const lock = useRef(false);
  function _start() {
    if (lock.current) return;
    lock.current = true;
    setError(null);
    startTransition(async () => {
      try {
        await startV2Workout({
          templateId,
          activeSessionIdToCancel: confirming ? activeWorkout?.id : undefined,
        });
      } catch (error) {
        unstable_rethrow(error);
        setError(
          "Couldn’t start this workout. Refresh to check for an active session before trying again.",
        );
      } finally {
        lock.current = false;
      }
    });
  }
  return (
    <div className="v2-start-control">
      {confirming && activeWorkout ? (
        <>
          <p>
            Abandon {activeWorkout.templateName} and start this plan? Its logged
            sets will be kept.
          </p>
          <div className="v2-actions">
            <Button disabled={pending || Boolean(error)} onClick={_start}>
              {pending ? "Starting…" : "Abandon and start"}
            </Button>
            <ButtonLink
              variant="secondary"
              href={`/v2/workouts/${activeWorkout.id}`}
            >
              Resume current
            </ButtonLink>
            <Button
              variant="quiet"
              disabled={pending}
              onClick={() => setConfirming(false)}
            >
              Cancel
            </Button>
          </div>
        </>
      ) : (
        <Button
          disabled={!hasExercises || pending || Boolean(error)}
          onClick={() => (activeWorkout ? setConfirming(true) : _start())}
        >
          {!hasExercises
            ? "Add exercises first"
            : pending
              ? "Starting…"
              : "Start workout"}
        </Button>
      )}
      {error && (
        <p role="alert" className="v2-error">
          {error}
        </p>
      )}
    </div>
  );
}
