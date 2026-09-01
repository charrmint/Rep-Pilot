import Link from "next/link";

import { getWorkoutDurationLabel } from "../workout-history";
import type { ExerciseHistoryPerformance } from "../types";
import { LocalDateTime } from "./local-date-time";
import { WorkoutHistoryStatusBadge } from "./workout-history-status-badge";
import { WorkoutSetSummary } from "./workout-set-summary";

interface ExercisePerformanceListProps {
  performances: ExerciseHistoryPerformance[];
}

export function ExercisePerformanceList({
  performances,
}: ExercisePerformanceListProps) {
  if (performances.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-5 text-sm text-gray-600">
        No logged working sets for this exercise yet.
      </div>
    );
  }

  return (
    <ol className="flex flex-col gap-3">
      {performances.map((performance) => {
        const duration = getWorkoutDurationLabel(performance);

        return (
          <li key={performance.sessionExerciseId}>
            <article className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
              <header className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  {performance.templateId ? (
                    <Link
                      href={`/workouts/templates/${performance.templateId}`}
                      className="font-semibold text-gray-950 hover:text-blue-700"
                    >
                      {performance.templateName}
                    </Link>
                  ) : (
                    <p className="font-semibold text-gray-950">
                      {performance.templateName}
                    </p>
                  )}
                  <p className="mt-1 text-sm text-gray-600">
                    <LocalDateTime
                      value={performance.startedAt}
                      dateStyle="medium"
                    />
                    {duration ? ` · ${duration}` : ""}
                  </p>
                </div>
                <WorkoutHistoryStatusBadge
                  status={performance.sessionStatus}
                />
              </header>

              <div className="mt-4">
                <WorkoutSetSummary sets={performance.sets} />
              </div>

              <Link
                href={`/workouts/${performance.workoutSessionId}`}
                className="mt-4 inline-flex min-h-10 items-center text-sm font-semibold text-gray-700 hover:text-gray-950"
              >
                View complete workout →
              </Link>
            </article>
          </li>
        );
      })}
    </ol>
  );
}
