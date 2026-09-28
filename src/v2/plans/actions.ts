"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/features/auth/auth-server-service";
import { createWorkoutTemplate, renameWorkoutTemplate } from "@/features/templates/template-service";
import { readStringFormValue } from "@/app/_shared/form-values";
import type { PlanNameResult } from "./types";

export async function createV2Plan(formData: FormData): Promise<PlanNameResult> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  try {
    const plan = await createWorkoutTemplate({ userId: user.id, name: readStringFormValue(formData, "name") });
    _revalidatePlan(plan.id);
    return { status: "success", plan: { id: plan.id, name: plan.name } };
  } catch (error) {
    return _planError(error);
  }
}

export async function renameV2Plan(formData: FormData): Promise<PlanNameResult> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  try {
    const plan = await renameWorkoutTemplate({
      userId: user.id,
      templateId: readStringFormValue(formData, "templateId"),
      name: readStringFormValue(formData, "name"),
    });
    _revalidatePlan(plan.id);
    return { status: "success", plan: { id: plan.id, name: plan.name } };
  } catch (error) {
    return _planError(error);
  }
}

function _revalidatePlan(id: string) {
  revalidatePath("/v2", "layout");
  revalidatePath("/templates");
  revalidatePath(`/templates/${id}/edit`);
  revalidatePath("/workouts", "layout");
}

function _planError(error: unknown): PlanNameResult {
  const messages: Record<string, string> = {
    "Template name is required.": "Enter a plan name.",
    "Template name must be 80 characters or fewer.": "Use 80 characters or fewer for your plan name.",
    "A template with this name already exists.": "A plan with this name already exists, including archived plans. Choose another name.",
    "A template or template exercise with this value already exists.": "A plan with this name already exists. Choose another name.",
    "Template not found.": "This plan is no longer available. Return to your library.",
  };
  return { status: "error", message: (error instanceof Error && messages[error.message]) || "We couldn’t confirm the save. Check your library before trying again." };
}
