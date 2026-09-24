import { cache } from "react";
import { connection } from "next/server";
import { getCurrentUser } from "@/features/auth/auth-server-service";
import { getActiveWorkout } from "@/features/workouts/workout-service";

// Request-scoped: the shell and screens share the existing auth/workout services.
export const getV2Context = cache(async () => {
  await connection();
  const user = await getCurrentUser();
  const activeWorkout = user ? await getActiveWorkout(user.id) : null;
  return { user, activeWorkout };
});
