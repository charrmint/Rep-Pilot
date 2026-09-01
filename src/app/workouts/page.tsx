import { redirect } from "next/navigation";
import { connection } from "next/server";

import { getCurrentUser } from "@/features/auth/auth-server-service";
import { ActiveWorkoutBanner } from "@/features/workouts/components/active-workout-banner";
import { HistoryPagination } from "@/features/workouts/components/history-pagination";
import { WorkoutHistoryList } from "@/features/workouts/components/workout-history-list";
import { parseWorkoutHistoryPage } from "@/features/workouts/workout-history";
import {
  getActiveWorkout,
  listRecentWorkoutHistory,
} from "@/features/workouts/workout-service";

import { WorkoutHistoryShell } from "./_shared/workout-history-shell";

interface WorkoutHistoryPageProps {
  searchParams: Promise<{
    page?: string | string[];
  }>;
}

export default async function WorkoutHistoryPage({
  searchParams,
}: WorkoutHistoryPageProps) {
  await connection();

  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const page = parseWorkoutHistoryPage((await searchParams).page);
  const [history, activeWorkout] = await Promise.all([
    listRecentWorkoutHistory({ userId: user.id, page }),
    getActiveWorkout(user.id),
  ]);

  return (
    <WorkoutHistoryShell
      activeView="recent"
      userEmail={user.email}
      eyebrow="Workout History"
      title="Recent workouts"
      description="Review completed and abandoned sessions in chronological order."
    >
      {activeWorkout ? <ActiveWorkoutBanner workout={activeWorkout} /> : null}
      <WorkoutHistoryList workouts={history.items} />
      <HistoryPagination
        basePath="/workouts"
        page={history.page}
        hasPreviousPage={history.hasPreviousPage}
        hasNextPage={history.hasNextPage}
        itemLabel="workouts"
      />
    </WorkoutHistoryShell>
  );
}
