import Link from "next/link";

import { getWorkoutDurationLabel } from "../workout-history";
import type { WorkoutHistorySession } from "../types";
import { LocalDateTime } from "./local-date-time";
import { WorkoutHistoryStatusBadge } from "./workout-history-status-badge";

interface WorkoutHistoryListProps {
  workouts: WorkoutHistorySession[];
}

export function WorkoutHistoryList({ workouts }: WorkoutHistoryListProps) {
  if (workouts.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-5 text-sm text-gray-600">
        No past workouts yet. Finish or abandon a workout and it will appear
        here.
      </div>
    );
  }

  return (
    <ol className="flex flex-col gap-3">
      {workouts.map((workout) => {
        const workingSetCount = _getWorkingSetCount(workout);
        const duration = getWorkoutDurationLabel(workout);

        return (
          <li key={workout.id}>
            <Link
              href={`/workouts/${workout.id}`}
              className="block rounded-lg border border-gray-200 bg-white p-4 shadow-sm transition hover:border-gray-400 hover:shadow"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <h2 className="truncate text-lg font-semibold text-gray-950">
                    {workout.templateName}
                  </h2>
                  <p className="mt-1 text-sm text-gray-600">
                    <LocalDateTime
                      value={workout.startedAt}
                      dateStyle="medium"
                    />
                    {duration ? ` · ${duration}` : ""}
                  </p>
                </div>
                <span aria-hidden="true" className="text-gray-400">
                  ›
                </span>
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-2">
                <WorkoutHistoryStatusBadge status={workout.status} />
                <span className="text-xs font-medium text-gray-500">
                  {_formatExerciseCount(workout.exercises.length)} ·{" "}
                  {_formatSetCount(workingSetCount)}
                </span>
              </div>

              <p className="mt-3 line-clamp-2 text-sm text-gray-600">
                {workout.exercises
                  .map((exercise) => exercise.exerciseName)
                  .join(", ")}
              </p>
            </Link>
          </li>
        );
      })}
    </ol>
  );
}

function _getWorkingSetCount(workout: WorkoutHistorySession): number {
  return workout.exercises.reduce(
    (total, exercise) => total + exercise.sets.length,
    0,
  );
}

function _formatExerciseCount(count: number): string {
  return count === 1 ? "1 exercise" : `${count} exercises`;
}

function _formatSetCount(count: number): string {
  return count === 1 ? "1 working set" : `${count} working sets`;
}
