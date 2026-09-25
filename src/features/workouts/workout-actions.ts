"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getCurrentUser } from "@/features/auth/auth-server-service";

import {
  cancelWorkout,
  deleteWorkoutSet,
  finishWorkout,
  saveWorkoutSet,
  startWorkout,
} from "./workout-service";
import type {
  DeleteWorkoutSetInput,
  SaveWorkoutSetInput,
  StartWorkoutInput,
  WorkoutSet,
} from "./types";

export async function startWorkoutAction(
  input: StartWorkoutInput,
): Promise<never> {
  await _getRequiredUserId();
  const sessionId = await startWorkout(input);
  revalidatePath("/v2", "layout");

  revalidatePath("/templates");
  redirect(`/workouts/${sessionId}`);
}

export async function saveWorkoutSetAction(
  input: SaveWorkoutSetInput,
): Promise<WorkoutSet> {
  const userId = await _getRequiredUserId();
  const set = await saveWorkoutSet({ userId, input });
  revalidatePath("/v2");

  return set;
}

export async function deleteWorkoutSetAction(
  input: DeleteWorkoutSetInput,
): Promise<void> {
  const userId = await _getRequiredUserId();

  await deleteWorkoutSet({ userId, input });
  revalidatePath("/v2");
}

export async function finishWorkoutAction(sessionId: string): Promise<never> {
  const userId = await _getRequiredUserId();

  await finishWorkout({ userId, sessionId });
  revalidatePath("/v2", "layout");
  revalidatePath(`/workouts/${sessionId}`);
  revalidatePath("/templates");
  redirect(`/workouts/${sessionId}`);
}

export async function cancelWorkoutAction(sessionId: string): Promise<never> {
  const userId = await _getRequiredUserId();

  await cancelWorkout({ userId, sessionId });
  revalidatePath("/v2", "layout");
  revalidatePath("/templates");
  redirect("/templates");
}

async function _getRequiredUserId(): Promise<string> {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return user.id;
}
