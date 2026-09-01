import { redirect } from "next/navigation";
import { connection } from "next/server";

import { getCurrentUser } from "@/features/auth/auth-server-service";
import { ExerciseHistoryList } from "@/features/workouts/components/exercise-history-list";
import { listExerciseHistorySummaries } from "@/features/workouts/workout-service";

import { WorkoutHistoryShell } from "../_shared/workout-history-shell";

export default async function ExerciseHistoryPage() {
  await connection();

  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const exercises = await listExerciseHistorySummaries(user.id);

  return (
    <WorkoutHistoryShell
      activeView="exercises"
      userEmail={user.email}
      eyebrow="Exercise History"
      title="Performance by exercise"
      description="Choose an exercise to review each logged performance in chronological order."
    >
      <ExerciseHistoryList exercises={exercises} />
    </WorkoutHistoryShell>
  );
}
