import Link from "next/link";

import { getWorkoutDurationLabel } from "../workout-history";
import type { WorkoutHistorySession } from "../types";
import { LocalDateTime } from "./local-date-time";
import { WorkoutHistoryStatusBadge } from "./workout-history-status-badge";
import { WorkoutSetSummary } from "./workout-set-summary";

interface WorkoutPerformanceCardProps {
  workout: WorkoutHistorySession;
}

export function WorkoutPerformanceCard({
  workout,
}: WorkoutPerformanceCardProps) {
  const duration = getWorkoutDurationLabel(workout);

  return (
    <article className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
      <header className="flex flex-wrap items-start justify-between gap-3 border-b border-gray-100 pb-4">
        <div>
          <p className="font-semibold text-gray-950">
            <LocalDateTime value={workout.startedAt} dateStyle="medium" />
          </p>
          <p className="mt-1 text-sm text-gray-500">
            {duration ?? "Duration unavailable"}
          </p>
        </div>
        <WorkoutHistoryStatusBadge status={workout.status} />
      </header>

      <ol className="mt-4 flex flex-col gap-4">
        {workout.exercises.map((exercise) => (
          <li key={exercise.sessionExerciseId}>
            <div className="mb-2 flex items-baseline justify-between gap-3">
              <h3 className="font-semibold text-gray-950">
                {exercise.exerciseName}
              </h3>
              <Link
                href={`/workouts/exercises/${exercise.exerciseId}`}
                className="shrink-0 text-xs font-semibold text-blue-700 hover:text-blue-900"
              >
                Exercise history
              </Link>
            </div>
            <WorkoutSetSummary sets={exercise.sets} />
          </li>
        ))}
      </ol>

      <Link
        href={`/workouts/${workout.id}`}
        className="mt-5 inline-flex min-h-10 items-center text-sm font-semibold text-gray-700 hover:text-gray-950"
      >
        View complete workout →
      </Link>
    </article>
  );
}
