"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/features/auth/auth-server-service";
import {
  getWorkoutSession,
  startWorkout,
} from "@/features/workouts/workout-service";
import type { StartWorkoutInput } from "@/features/workouts/types";

export async function startV2Workout(input: StartWorkoutInput): Promise<never> {
  await _requireUser();
  const id = await startWorkout(input);
  revalidatePath("/v2", "layout");
  revalidatePath("/templates");
  redirect(`/v2/workouts/${id}`);
}

export async function reloadV2Workout(sessionId: string) {
  const user = await _requireUser();
  const workout = await getWorkoutSession({ userId: user.id, sessionId });
  if (!workout) throw new Error("Workout not found.");
  return workout;
}

async function _requireUser() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}
