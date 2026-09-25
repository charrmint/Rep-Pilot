import { cache } from "react";
import { connection } from "next/server";
import { unstable_rethrow } from "next/navigation";
import { getCurrentUser } from "@/features/auth/auth-server-service";
import { getActiveWorkout } from "@/features/workouts/workout-service";
import type { V2Context } from "./types";

// Request-scoped: the shell and screens share the existing auth/workout services.
export const getV2Context = cache(async (): Promise<V2Context> => {
  await connection();
  // Authentication failures remain errors; they must not look like sign-out.
  const user = await getCurrentUser();
  try {
    const activeWorkout = user ? await getActiveWorkout(user.id) : null;
    return { user, activeWorkout, activeWorkoutUnavailable: false };
  } catch (error) {
    unstable_rethrow(error);
    return { user, activeWorkout: null, activeWorkoutUnavailable: true };
  }
});
