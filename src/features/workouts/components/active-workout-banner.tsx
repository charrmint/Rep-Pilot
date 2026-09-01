import Link from "next/link";

import type { ActiveWorkoutSummary } from "../types";
import { LocalDateTime } from "./local-date-time";

interface ActiveWorkoutBannerProps {
  workout: ActiveWorkoutSummary;
}

export function ActiveWorkoutBanner({ workout }: ActiveWorkoutBannerProps) {
  return (
    <section className="flex flex-col gap-3 rounded-md border border-blue-200 bg-blue-50 p-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="text-sm font-semibold text-blue-950">
          Workout in progress
        </p>
        <p className="mt-1 text-sm text-blue-800">
          {workout.templateName} · Started{" "}
          <LocalDateTime value={workout.startedAt} />
        </p>
      </div>
      <Link
        href={`/workouts/${workout.id}`}
        className="min-h-11 rounded-md bg-blue-950 px-4 py-2.5 text-center text-sm font-semibold text-white transition hover:bg-blue-900"
      >
        Resume workout
      </Link>
    </section>
  );
}
