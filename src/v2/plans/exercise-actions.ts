"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/features/auth/auth-server-service";
import { listAvailableExercises } from "@/features/exercises/exercise-service";
import {
  addWorkoutTemplateExercise,
  getWorkoutTemplateDetails,
  moveWorkoutTemplateExercise,
  removeWorkoutTemplateExercise,
  updateWorkoutTemplateExercise,
} from "@/features/templates/template-service";
import {
  readNumberFormValue,
  readStringFormValue,
  readWeightUnitFormValue,
} from "@/app/_shared/form-values";
import type { WorkoutTemplateExerciseConfigInput } from "@/features/templates/types";
import type { PlanEditorData, PlanExerciseResult } from "./types";

export async function reloadV2Plan(templateId: string): Promise<PlanEditorData> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const data = await _loadPlan(user.id, templateId);
  _revalidatePlan(templateId);
  return data;
}

export async function mutateV2PlanExercise(formData: FormData): Promise<PlanExerciseResult> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const templateId = readStringFormValue(formData, "templateId");
  try {
    const { plan, availableExercises } = await _loadPlan(user.id, templateId);
    const intent = readStringFormValue(formData, "intent");
    const templateExerciseId = readStringFormValue(formData, "templateExerciseId");
    const identity = { userId: user.id, templateId, templateExerciseId };
    let message: string;
    if (intent === "add") {
      const exerciseId = readStringFormValue(formData, "exerciseId");
      if (!availableExercises.some((exercise) => exercise.id === exerciseId && !exercise.isArchived)) {
        throw new Error("Choose an active exercise from your library.");
      }
      await addWorkoutTemplateExercise({ userId: user.id, templateId, exerciseId, config: _readConfig(formData) });
      message = "Exercise added.";
    } else {
      if (!plan.exercises.some((exercise) => exercise.id === templateExerciseId)) {
        throw new Error("This exercise is no longer in the plan.");
      }
      if (intent === "save") {
        await updateWorkoutTemplateExercise({ ...identity, config: _readConfig(formData) });
        message = "Exercise saved.";
      } else if (intent === "remove") {
        await removeWorkoutTemplateExercise(identity);
        message = "Exercise removed from the plan.";
      } else if (intent === "move_up" || intent === "move_down") {
        await moveWorkoutTemplateExercise({ ...identity, direction: intent });
        message = "Exercise order saved.";
      } else {
        throw new Error("Unknown plan action.");
      }
    }
    _revalidatePlan(templateId);
    return { status: "success", data: await _loadPlan(user.id, templateId), message };
  } catch (error) {
    // Existing reorder/removal services use multiple writes; reload after failures too.
    _revalidatePlan(templateId);
    let data: PlanEditorData | null = null;
    try {
      data = await _loadPlan(user.id, templateId);
    } catch {
      // The client locks mutations until a recovery read succeeds.
    }
    return { status: "error", data, message: _errorMessage(error) };
  }
}

async function _loadPlan(userId: string, templateId: string): Promise<PlanEditorData> {
  const plan = await getWorkoutTemplateDetails({ userId, templateId });
  if (!plan) throw new Error("This plan is no longer available.");
  return { plan, availableExercises: await listAvailableExercises() };
}

function _readConfig(formData: FormData): WorkoutTemplateExerciseConfigInput {
  const fields = ["targetSets", "minReps", "maxReps", "defaultWeightValue", "weightIncrementLbs"];
  if (fields.some((field) => !readStringFormValue(formData, field).trim())) {
    throw new Error("Fill in every exercise setting.");
  }
  return {
    targetSets: readNumberFormValue(formData, "targetSets"),
    minReps: readNumberFormValue(formData, "minReps"),
    maxReps: readNumberFormValue(formData, "maxReps"),
    defaultWeightValue: readNumberFormValue(formData, "defaultWeightValue"),
    defaultWeightUnit: readWeightUnitFormValue(formData, "defaultWeightUnit"),
    weightIncrementLbs: readNumberFormValue(formData, "weightIncrementLbs"),
  };
}

function _revalidatePlan(templateId: string) {
  revalidatePath("/v2", "layout");
  revalidatePath("/templates");
  revalidatePath(`/templates/${templateId}/edit`);
}

function _errorMessage(error: unknown): string {
  const safeMessages = new Set([
    "Choose an active exercise from your library.", "This exercise is no longer in the plan.",
    "This plan is no longer available.", "Unknown plan action.", "Fill in every exercise setting.",
    "Target sets must be a positive whole number.", "Minimum reps must be a positive whole number.",
    "Maximum reps must be a positive whole number.", "Maximum reps must be greater than or equal to minimum reps.",
    "Default weight must be a number.", "Default weight cannot be negative.",
    "Weight increment must be a number.", "Weight increment must be greater than zero.",
    "Weight unit must be lb or kg.",
  ]);
  if (error instanceof Error) {
    if (safeMessages.has(error.message)) return error.message;
    if (error.message === "This exercise is already in the template.") return "This exercise is already in your plan.";
  }
  return "We couldn’t confirm the change. Review the saved plan before trying again.";
}
