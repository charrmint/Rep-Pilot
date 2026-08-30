"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import type { FormActionState } from "../_shared/form-action-state";
import { getCurrentUser } from "@/features/auth/auth-server-service";
import {
  createWorkoutTemplate,
  setWorkoutTemplateArchiveStatus,
} from "@/features/templates/template-service";

export async function createWorkoutTemplateAction(
  _previousState: FormActionState,
  formData: FormData,
): Promise<FormActionState> {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  try {
    await createWorkoutTemplate({
      userId: user.id,
      name: _readStringFormValue(formData, "name"),
    });
    revalidatePath("/templates");

    return {
      status: "success",
      message: "Template created.",
    };
  } catch (error) {
    return _toFormActionError(error);
  }
}

export async function setWorkoutTemplateArchiveStatusAction(
  _previousState: FormActionState,
  formData: FormData,
): Promise<FormActionState> {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const isArchived = _readBooleanFormValue(formData, "isArchived");

  try {
    await setWorkoutTemplateArchiveStatus({
      userId: user.id,
      templateId: _readStringFormValue(formData, "templateId"),
      isArchived,
    });
    revalidatePath("/templates");

    return {
      status: "success",
      message: isArchived ? "Template archived." : "Template restored.",
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
    message:
      error instanceof Error ? error.message : "Template update failed.",
  };
}
