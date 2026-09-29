"use server";

import { redirect, unstable_rethrow } from "next/navigation";
import { getCurrentUser } from "@/features/auth/auth-server-service";
import { setWorkoutTemplateArchiveStatus } from "@/features/templates/template-service";
import { readStringFormValue } from "@/app/_shared/form-values";
import { loadPlanEditorData, revalidatePlanViews } from "./plan-state";
import type { PlanMutationResult } from "./types";

export async function mutateV2PlanArchive(formData: FormData): Promise<PlanMutationResult> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const templateId = readStringFormValue(formData, "templateId");
  const intent = readStringFormValue(formData, "intent");
  try {
    if (intent !== "archive" && intent !== "restore") throw new Error("Unknown plan action.");
    const data = await loadPlanEditorData(user.id, templateId);
    const isArchived = intent === "archive";
    // Set the requested state explicitly so retrying cannot invert it.
    if (data.plan.isArchived !== isArchived) {
      await setWorkoutTemplateArchiveStatus({ userId: user.id, templateId, isArchived });
    }
    revalidatePlanViews(templateId);
    return {
      status: "success",
      data: await loadPlanEditorData(user.id, templateId),
      message: isArchived ? "Plan archived. Find it in Library under Archived." : "Plan restored. Find it in your active plans.",
    };
  } catch (error) {
    unstable_rethrow(error);
    revalidatePlanViews(templateId);
    let data = null;
    try {
      data = await loadPlanEditorData(user.id, templateId);
    } catch (readError) {
      unstable_rethrow(readError);
      // Keep mutations locked if the saved status cannot be verified.
    }
    const message = error instanceof Error && ["Unknown plan action.", "This plan is no longer available."].includes(error.message)
      ? error.message
      : "We couldn’t confirm the archive change. Check the saved plan status before trying again.";
    return { status: "error", data, message };
  }
}
