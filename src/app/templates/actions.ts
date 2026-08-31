"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import type { FormActionState } from "../_shared/form-action-state";
import { getCurrentUser } from "@/features/auth/auth-server-service";
import {
  createWorkoutTemplate,
  setWorkoutTemplateArchiveStatus,
} from "@/features/templates/template-service";

import { readStringFormValue } from "../_shared/form-values";

export async function createWorkoutTemplateAction(
  _previousState: FormActionState,
  formData: FormData,
): Promise<FormActionState> {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  let templateId: string;

  try {
    const template = await createWorkoutTemplate({
      userId: user.id,
      name: readStringFormValue(formData, "name"),
    });
    templateId = template.id;
    revalidatePath("/templates");
  } catch (error) {
    return _toFormActionError(error);
  }

  redirect(`/templates/${templateId}/edit`);
}

export async function setWorkoutTemplateArchiveStatusAction(
  _previousState: FormActionState,
  formData: FormData,
): Promise<FormActionState> {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const isArchived = readStringFormValue(formData, "isArchived") === "true";

  try {
    await setWorkoutTemplateArchiveStatus({
      userId: user.id,
      templateId: readStringFormValue(formData, "templateId"),
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

function _toFormActionError(error: unknown): FormActionState {
  return {
    status: "error",
    message:
      error instanceof Error ? error.message : "Template update failed.",
  };
}
