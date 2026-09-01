import Link from "next/link";

import type { ExerciseHistorySummary } from "../types";
import { LocalDateTime } from "./local-date-time";

interface ExerciseHistoryListProps {
  exercises: ExerciseHistorySummary[];
}

export function ExerciseHistoryList({ exercises }: ExerciseHistoryListProps) {
  if (exercises.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-5 text-sm text-gray-600">
        No exercise performance history yet.
      </div>
    );
  }

  return (
    <ul className="grid gap-3 sm:grid-cols-2">
      {exercises.map((exercise) => (
        <li key={exercise.exerciseId}>
          <Link
            href={`/workouts/exercises/${exercise.exerciseId}`}
            className="flex h-full flex-col rounded-lg border border-gray-200 bg-white p-4 shadow-sm transition hover:border-gray-400 hover:shadow"
          >
            <div className="flex items-start justify-between gap-3">
              <h2 className="min-w-0 truncate text-lg font-semibold text-gray-950">
                {exercise.exerciseName}
              </h2>
              <span aria-hidden="true" className="text-gray-400">
                ›
              </span>
            </div>
            <p className="mt-2 text-sm text-gray-600">
              Last performed{" "}
              <LocalDateTime
                value={exercise.lastPerformedAt}
                dateStyle="medium"
              />
            </p>
            <span className="mt-4 w-fit rounded-full bg-gray-100 px-2 py-1 text-xs font-semibold text-gray-700">
              {_formatPerformanceCount(exercise.performanceCount)}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

function _formatPerformanceCount(count: number): string {
  return count === 1 ? "1 performance" : `${count} performances`;
}
