"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/features/auth/auth-server-service";
import {
  getWorkoutSession,
  startWorkout,
  finishWorkout,
  cancelWorkout,
} from "@/features/workouts/workout-service";
import type { StartWorkoutInput } from "@/features/workouts/types";
import type { WorkoutEndIntent } from "./types";

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
  if (workout.status !== "in_progress") _revalidateWorkout(sessionId);
  return workout;
}

export async function endV2Workout(
  sessionId: string,
  intent: WorkoutEndIntent,
) {
  const user = await _requireUser();
  if (intent === "finish") {
    await finishWorkout({ userId: user.id, sessionId });
  } else if (intent === "abandon") {
    await cancelWorkout({ userId: user.id, sessionId });
  } else {
    throw new Error("Unknown workout action.");
  }
  _revalidateWorkout(sessionId);
  const workout = await getWorkoutSession({ userId: user.id, sessionId });
  if (!workout || workout.status === "in_progress")
    throw new Error("Unable to confirm the workout status.");
  return workout;
}

function _revalidateWorkout(sessionId: string) {
  revalidatePath("/v2", "layout");
  revalidatePath(`/workouts/${sessionId}`);
  revalidatePath("/workouts", "layout");
  revalidatePath("/templates");
  revalidatePath("/exercises");
}

async function _requireUser() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}
