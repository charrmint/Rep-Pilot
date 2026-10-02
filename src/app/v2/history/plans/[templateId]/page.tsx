import { PlanHistoryScreen } from "@/v2/history/history-screens";
import { parseWorkoutHistoryPage } from "@/features/workouts/workout-history";
import type { HistoryPageProps } from "@/v2/history/types";
export default async function Page({ params, searchParams }: HistoryPageProps & { params: Promise<{ templateId: string }> }) {
  const [subject, search] = await Promise.all([params, searchParams]);
  return <PlanHistoryScreen templateId={subject.templateId} page={parseWorkoutHistoryPage(search.page)} />;
}
