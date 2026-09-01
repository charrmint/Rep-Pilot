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

  revalidatePath("/templates");
  redirect(`/workouts/${sessionId}`);
}

export async function saveWorkoutSetAction(
  input: SaveWorkoutSetInput,
): Promise<WorkoutSet> {
  const userId = await _getRequiredUserId();
  const set = await saveWorkoutSet({ userId, input });

  return set;
}

export async function deleteWorkoutSetAction(
  input: DeleteWorkoutSetInput,
): Promise<void> {
  const userId = await _getRequiredUserId();

  await deleteWorkoutSet({ userId, input });
}

export async function finishWorkoutAction(sessionId: string): Promise<never> {
  const userId = await _getRequiredUserId();

  await finishWorkout({ userId, sessionId });
  revalidatePath(`/workouts/${sessionId}`);
  revalidatePath("/templates");
  redirect(`/workouts/${sessionId}`);
}

export async function cancelWorkoutAction(sessionId: string): Promise<never> {
  const userId = await _getRequiredUserId();

  await cancelWorkout({ userId, sessionId });
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
