"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getCurrentUser } from "@/features/auth/auth-server-service";
import {
  createCustomExercise,
  setCustomExerciseArchiveStatus,
} from "@/features/exercises/exercise-service";

import type { FormActionState } from "./form-state";

export async function createCustomExerciseAction(
  _previousState: FormActionState,
  formData: FormData,
): Promise<FormActionState> {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  try {
    await createCustomExercise({
      userId: user.id,
      name: _readStringFormValue(formData, "name"),
    });
    revalidatePath("/exercises");

    return {
      status: "success",
      message: "Exercise added.",
    };
  } catch (error) {
    return _toFormActionError(error);
  }
}

export async function setCustomExerciseArchiveStatusAction(
  _previousState: FormActionState,
  formData: FormData,
): Promise<FormActionState> {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  try {
    await setCustomExerciseArchiveStatus({
      userId: user.id,
      exerciseId: _readStringFormValue(formData, "exerciseId"),
      isArchived: _readBooleanFormValue(formData, "isArchived"),
    });
    revalidatePath("/exercises");

    return {
      status: "success",
      message: "Exercise updated.",
    };
  } catch (error) {
    return _toFormActionError(error);
  }
}

function _readStringFormValue(formData: FormData, name: string): string {
  const value = formData.get(name);

  return typeof value === "string" ? value : "";
}

function _readBooleanFormValue(formData: FormData, name: string): boolean {
  return _readStringFormValue(formData, name) === "true";
}

function _toFormActionError(error: unknown): FormActionState {
  return {
    status: "error",
    message: error instanceof Error ? error.message : "Exercise update failed.",
  };
}
