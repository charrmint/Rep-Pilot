"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getCurrentUser } from "@/features/auth/auth-server-service";
import {
  createCustomExercise,
  setCustomExerciseArchiveStatus,
} from "@/features/exercises/exercise-service";

import type { FormActionState } from "../_shared/form-action-state";
import { readStringFormValue } from "../_shared/form-values";

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
      name: readStringFormValue(formData, "name"),
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
      exerciseId: readStringFormValue(formData, "exerciseId"),
      isArchived: readStringFormValue(formData, "isArchived") === "true",
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

function _toFormActionError(error: unknown): FormActionState {
  return {
    status: "error",
    message: error instanceof Error ? error.message : "Exercise update failed.",
  };
}
