"use server";

import { revalidatePath } from "next/cache";
import { redirect, unstable_rethrow } from "next/navigation";
import { getCurrentUser } from "@/features/auth/auth-server-service";
import { createCustomExercise, listExerciseLibrary, setCustomExerciseArchiveStatus } from "@/features/exercises/exercise-service";
import { addWorkoutTemplateExercise, listWorkoutTemplateLibrary } from "@/features/templates/template-service";
import { DEFAULT_WORKOUT_TEMPLATE_EXERCISE_CONFIG } from "@/features/templates/template-defaults";
import { readStringFormValue } from "@/app/_shared/form-values";
import type { ExerciseManagerData, ExerciseMutationResult } from "./types";

async function _load(userId: string): Promise<ExerciseManagerData> {
  const [exercises, plans] = await Promise.all([listExerciseLibrary(), listWorkoutTemplateLibrary(userId)]);
  return { exercises, plans: plans.activeTemplates };
}
function _revalidate() {
  revalidatePath("/v2", "layout");
  revalidatePath("/exercises");
  revalidatePath("/templates", "layout");
}

export async function mutateV2Exercise(form: FormData): Promise<ExerciseMutationResult> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const intent = readStringFormValue(form, "intent");
  try {
    const data = await _load(user.id);
    let message = "Library refreshed. Check the saved state before trying again.";
    if (intent === "create") {
      await createCustomExercise({ userId: user.id, name: readStringFormValue(form, "name") });
      message = "Exercise created. Find it under Active.";
    } else if (intent === "archive" || intent === "restore" || intent === "assign") {
      const exerciseId = readStringFormValue(form, "exerciseId");
      const exercise = [...data.exercises.activeExercises, ...data.exercises.archivedCustomExercises].find(item => item.id === exerciseId);
      if (!exercise) throw new Error("Exercise unavailable.");
      if (intent === "assign") {
        const templateId = readStringFormValue(form, "templateId");
        const plan = data.plans.find(item => item.id === templateId);
        if (!plan || exercise.isArchived) throw new Error("Choose an active exercise and plan.");
        if (!plan.exercises.some(item => item.exerciseId === exerciseId)) {
          await addWorkoutTemplateExercise({ userId: user.id, templateId, exerciseId, config: DEFAULT_WORKOUT_TEMPLATE_EXERCISE_CONFIG });
        }
        message = "Exercise added to plan.";
      } else {
        if (exercise.isSystemExercise) throw new Error("Built-in exercises cannot be archived.");
        if (exercise.isArchived !== (intent === "archive")) {
          await setCustomExerciseArchiveStatus({ userId: user.id, exerciseId, isArchived: intent === "archive" });
        }
        message = intent === "archive" ? "Exercise archived. Existing plans and history are unchanged." : "Exercise restored. Find it under Active.";
      }
    } else if (intent !== "refresh") {
      throw new Error("Unknown exercise action.");
    }
    _revalidate();
    return { status: "success", message, data: await _load(user.id) };
  } catch (error) {
    unstable_rethrow(error);
    _revalidate();
    let data = null;
    try { data = await _load(user.id); } catch (readError) { unstable_rethrow(readError); }
    const safeMessages = ["Exercise name is required.", "Exercise name must be 80 characters or fewer.", "An exercise with this name already exists.", "Exercise unavailable.", "Choose an active exercise and plan.", "Built-in exercises cannot be archived.", "Unknown exercise action."];
    const message = error instanceof Error && safeMessages.includes(error.message)
      ? error.message
      : "We couldn’t confirm the change. Check the saved library before trying again.";
    return { status: "error", message, data };
  }
}
