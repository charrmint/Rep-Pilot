import { notFound, redirect } from "next/navigation";
import { connection } from "next/server";

import { getCurrentUser } from "@/features/auth/auth-server-service";
import { HistoryPagination } from "@/features/workouts/components/history-pagination";
import { WorkoutPerformanceCard } from "@/features/workouts/components/workout-performance-card";
import { parseWorkoutHistoryPage } from "@/features/workouts/workout-history";
import { getTemplateHistory } from "@/features/workouts/workout-service";

import { WorkoutHistoryShell } from "../../_shared/workout-history-shell";

interface TemplateHistoryDetailPageProps {
  params: Promise<{
    templateId: string;
  }>;
  searchParams: Promise<{
    page?: string | string[];
  }>;
}

export default async function TemplateHistoryDetailPage({
  params,
  searchParams,
}: TemplateHistoryDetailPageProps) {
  await connection();

  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const [{ templateId }, { page: pageValue }] = await Promise.all([
    params,
    searchParams,
  ]);
  const page = parseWorkoutHistoryPage(pageValue);
  const history = await getTemplateHistory({
    userId: user.id,
    templateId,
    page,
  });

  if (!history) {
    notFound();
  }

  return (
    <WorkoutHistoryShell
      activeView="templates"
      userEmail={user.email}
      eyebrow="Template Performance"
      title={history.template.name}
      description="Actual working sets from the three most recent workouts on this page."
    >
      {history.template.isArchived ? (
        <p className="w-fit rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
          Archived template
        </p>
      ) : null}

      {history.workouts.items.length === 0 ? (
        <div className="rounded-lg border border-gray-200 bg-white p-5 text-sm text-gray-600">
          No workout history for this template yet.
        </div>
      ) : (
        <ol className="flex flex-col gap-4">
          {history.workouts.items.map((workout) => (
            <li key={workout.id}>
              <WorkoutPerformanceCard workout={workout} />
            </li>
          ))}
        </ol>
      )}

      <HistoryPagination
        basePath={`/workouts/templates/${history.template.id}`}
        page={history.workouts.page}
        hasPreviousPage={history.workouts.hasPreviousPage}
        hasNextPage={history.workouts.hasNextPage}
        itemLabel="workouts"
      />
    </WorkoutHistoryShell>
  );
}
