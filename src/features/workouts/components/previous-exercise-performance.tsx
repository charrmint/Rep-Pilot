import type { PreviousExercisePerformance as PreviousExercisePerformanceData } from "../types";
import { LocalDateTime } from "./local-date-time";

interface PreviousExercisePerformanceProps {
  exerciseName: string;
  performance: PreviousExercisePerformanceData | null;
}

export function PreviousExercisePerformance({
  exerciseName,
  performance,
}: PreviousExercisePerformanceProps) {
  return (
    <section
      aria-label={`Previous performance for ${exerciseName}`}
      className="mt-4 rounded-md border border-blue-100 bg-blue-50 p-3"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <p className="text-xs font-semibold uppercase tracking-wide text-blue-900">
          Previous
        </p>
        {performance ? (
          <p className="text-xs text-blue-700">
            <LocalDateTime value={performance.startedAt} dateStyle="medium" />
          </p>
        ) : null}
      </div>

      {performance ? (
        <ol className="mt-2 flex flex-wrap gap-2">
          {performance.sets.map((set) => (
            <li
              key={set.id}
              className="rounded bg-white px-2.5 py-1.5 text-sm text-gray-800 shadow-xs"
            >
              <span className="mr-1 text-xs font-medium text-gray-500">
                {set.position}.
              </span>
              <span className="font-semibold">
                {set.weightValue} {set.weightUnit} × {set.reps}
              </span>
            </li>
          ))}
        </ol>
      ) : (
        <p className="mt-1 text-sm text-blue-800">
          No previous completed sets.
        </p>
      )}
    </section>
  );
}
