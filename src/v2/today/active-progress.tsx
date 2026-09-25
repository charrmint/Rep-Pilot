import { unstable_rethrow } from "next/navigation";
import { getWorkoutSession } from "@/features/workouts/workout-service";
import { plannedSetCount } from "../workouts/editor-state";
import { RetryButton } from "../ui/retry-button";
import type { ActiveProgressProps } from "./types";

export async function ActiveProgress({ userId, sessionId }: ActiveProgressProps) {
  let workout;
  try {
    workout = await getWorkoutSession({ userId, sessionId });
  } catch (error) {
    unstable_rethrow(error);
    return (
      <div className="v2-today-progress">
        <p role="alert">
          Set progress couldn’t load. You can still resume your workout.
        </p>
        <RetryButton />
      </div>
    );
  }
  if (!workout || workout.status !== "in_progress") {
    return (
      <div className="v2-today-progress">
        <p role="status">This workout has changed. Refresh to update Today.</p>
        <RetryButton />
      </div>
    );
  }
  const planned = workout.exercises.reduce(
    (total, exercise) => total + exercise.targetSets,
    0,
  );
  const logged = workout.exercises.reduce(
    (total, exercise) => total + plannedSetCount(exercise),
    0,
  );
  return (
    <div className="v2-today-progress">
      <p>{logged} of {planned} planned sets logged</p>
      {planned > 0 && (
        <progress
          aria-label="Planned sets logged"
          value={Math.min(logged, planned)}
          max={planned}
        />
      )}
    </div>
  );
}
