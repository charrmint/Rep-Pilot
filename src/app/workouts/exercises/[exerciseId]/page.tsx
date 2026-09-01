import { notFound, redirect } from "next/navigation";
import { connection } from "next/server";

import { getCurrentUser } from "@/features/auth/auth-server-service";
import { ExercisePerformanceList } from "@/features/workouts/components/exercise-performance-list";
import { HistoryPagination } from "@/features/workouts/components/history-pagination";
import { parseWorkoutHistoryPage } from "@/features/workouts/workout-history";
import { getExerciseHistory } from "@/features/workouts/workout-service";

import { WorkoutHistoryShell } from "../../_shared/workout-history-shell";

interface ExerciseHistoryDetailPageProps {
  params: Promise<{
    exerciseId: string;
  }>;
  searchParams: Promise<{
    page?: string | string[];
  }>;
}

export default async function ExerciseHistoryDetailPage({
  params,
  searchParams,
}: ExerciseHistoryDetailPageProps) {
  await connection();

  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const [{ exerciseId }, { page: pageValue }] = await Promise.all([
    params,
    searchParams,
  ]);
  const page = parseWorkoutHistoryPage(pageValue);
  const history = await getExerciseHistory({
    userId: user.id,
    exerciseId,
    page,
  });

  if (!history) {
    notFound();
  }

  return (
    <WorkoutHistoryShell
      activeView="exercises"
      userEmail={user.email}
      eyebrow="Exercise Performance"
      title={history.exerciseName}
      description="Working-set results grouped by workout, with links back to the complete session."
    >
      <ExercisePerformanceList performances={history.performances.items} />
      <HistoryPagination
        basePath={`/workouts/exercises/${history.exerciseId}`}
        page={history.performances.page}
        hasPreviousPage={history.performances.hasPreviousPage}
        hasNextPage={history.performances.hasNextPage}
        itemLabel="performances"
      />
    </WorkoutHistoryShell>
  );
}
