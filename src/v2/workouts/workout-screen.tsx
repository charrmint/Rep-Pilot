import { notFound, redirect } from "next/navigation";
import { getV2Context } from "../server/context";
import { getWorkoutSession } from "@/features/workouts/workout-service";
import { FocusedWorkout } from "./focused-workout";

export async function WorkoutScreen({ sessionId }: { sessionId: string }) {
  const { user } = await getV2Context();
  if (!user) redirect("/login");
  const workout = await getWorkoutSession({ userId: user.id, sessionId });
  if (!workout) notFound();
  return <FocusedWorkout key={workout.id} initialWorkout={workout} />;
}
