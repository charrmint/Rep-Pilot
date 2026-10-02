import { ExerciseHistoryScreen } from "@/v2/history/history-screens";
import { parseWorkoutHistoryPage } from "@/features/workouts/workout-history";
import type { HistoryPageProps } from "@/v2/history/types";
export default async function Page({ params, searchParams }: HistoryPageProps & { params: Promise<{ exerciseId: string }> }) {
  const [subject, search] = await Promise.all([params, searchParams]);
  return <ExerciseHistoryScreen exerciseId={subject.exerciseId} page={parseWorkoutHistoryPage(search.page)} />;
}
