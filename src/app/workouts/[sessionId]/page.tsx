import { notFound, redirect } from "next/navigation";
import { connection } from "next/server";

import { AppTopBar } from "@/app/_shared/app-top-bar";
import { getCurrentUser } from "@/features/auth/auth-server-service";
import { ActiveWorkoutScreen } from "@/features/workouts/components/active-workout-screen";
import { getWorkoutSession } from "@/features/workouts/workout-service";

interface WorkoutPageProps {
  params: Promise<{
    sessionId: string;
  }>;
}

export default async function WorkoutPage({ params }: WorkoutPageProps) {
  await connection();

  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const { sessionId } = await params;
  const workout = await getWorkoutSession({ userId: user.id, sessionId });

  if (!workout) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-6 sm:px-5 sm:py-8">
      <section className="mx-auto flex w-full max-w-3xl flex-col gap-6">
        <AppTopBar activeSection="workout" userEmail={user.email} />
        <ActiveWorkoutScreen initialWorkout={workout} />
      </section>
    </main>
  );
}
