import { revalidatePath } from "next/cache";
import { listAvailableExercises } from "@/features/exercises/exercise-service";
import { getWorkoutTemplateDetails } from "@/features/templates/template-service";
import type { PlanEditorData } from "./types";

export async function loadPlanEditorData(userId: string, templateId: string): Promise<PlanEditorData> {
  const plan = await getWorkoutTemplateDetails({ userId, templateId });
  if (!plan) throw new Error("This plan is no longer available.");
  return { plan, availableExercises: await listAvailableExercises() };
}

export function revalidatePlanViews(templateId: string) {
  revalidatePath("/v2", "layout");
  revalidatePath("/templates");
  revalidatePath(`/templates/${templateId}/edit`);
}
