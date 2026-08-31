"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import type { FormActionState } from "@/app/_shared/form-action-state";
import {
  readNumberFormValue,
  readStringFormValue,
  readWeightUnitFormValue,
} from "@/app/_shared/form-values";
import { getCurrentUser } from "@/features/auth/auth-server-service";
import {
  addWorkoutTemplateExercise,
  moveWorkoutTemplateExercise,
  removeWorkoutTemplateExercise,
  renameWorkoutTemplate,
  updateWorkoutTemplateExercise,
} from "@/features/templates/template-service";
import type {
  WorkoutTemplateExerciseConfigInput,
  WorkoutTemplateExerciseMoveDirection,
} from "@/features/templates/types";

export async function renameWorkoutTemplateAction(
  _previousState: FormActionState,
  formData: FormData,
): Promise<FormActionState> {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const templateId = readStringFormValue(formData, "templateId");

  try {
    await renameWorkoutTemplate({
      userId: user.id,
      templateId,
      name: readStringFormValue(formData, "name"),
    });
    _revalidateTemplateRoutes(templateId);

    return {
      status: "success",
      message: "Template renamed.",
    };
  } catch (error) {
    return _toFormActionError(error);
  }
}

export async function addWorkoutTemplateExerciseAction(
  _previousState: FormActionState,
  formData: FormData,
): Promise<FormActionState> {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const templateId = readStringFormValue(formData, "templateId");

  try {
    await addWorkoutTemplateExercise({
      userId: user.id,
      templateId,
      exerciseId: readStringFormValue(formData, "exerciseId"),
      config: _readTemplateExerciseConfig(formData),
    });
    _revalidateTemplateRoutes(templateId);

    return {
      status: "success",
      message: "Exercise added.",
    };
  } catch (error) {
    return _toFormActionError(error);
  }
}

export async function updateWorkoutTemplateExerciseAction(
  _previousState: FormActionState,
  formData: FormData,
): Promise<FormActionState> {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const templateId = readStringFormValue(formData, "templateId");

  try {
    await updateWorkoutTemplateExercise({
      userId: user.id,
      templateId,
      templateExerciseId: readStringFormValue(formData, "templateExerciseId"),
      config: _readTemplateExerciseConfig(formData),
    });
    _revalidateTemplateRoutes(templateId);

    return {
      status: "success",
      message: "Exercise config saved.",
    };
  } catch (error) {
    return _toFormActionError(error);
  }
}

export async function removeWorkoutTemplateExerciseAction(
  _previousState: FormActionState,
  formData: FormData,
): Promise<FormActionState> {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const templateId = readStringFormValue(formData, "templateId");

  try {
    await removeWorkoutTemplateExercise({
      userId: user.id,
      templateId,
      templateExerciseId: readStringFormValue(formData, "templateExerciseId"),
    });
    _revalidateTemplateRoutes(templateId);

    return {
      status: "success",
      message: "Exercise removed.",
    };
  } catch (error) {
    return _toFormActionError(error);
  }
}

export async function moveWorkoutTemplateExerciseAction(
  _previousState: FormActionState,
  formData: FormData,
): Promise<FormActionState> {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const templateId = readStringFormValue(formData, "templateId");

  try {
    await moveWorkoutTemplateExercise({
      userId: user.id,
      templateId,
      templateExerciseId: readStringFormValue(formData, "templateExerciseId"),
      direction: _readMoveDirection(formData),
    });
    _revalidateTemplateRoutes(templateId);

    return {
      status: "success",
      message: "Exercise moved.",
    };
  } catch (error) {
    return _toFormActionError(error);
  }
}

function _readTemplateExerciseConfig(
  formData: FormData,
): WorkoutTemplateExerciseConfigInput {
  return {
    targetSets: readNumberFormValue(formData, "targetSets"),
    minReps: readNumberFormValue(formData, "minReps"),
    maxReps: readNumberFormValue(formData, "maxReps"),
    defaultWeightValue: readNumberFormValue(formData, "defaultWeightValue"),
    defaultWeightUnit: readWeightUnitFormValue(formData, "defaultWeightUnit"),
    weightIncrementLbs: readNumberFormValue(formData, "weightIncrementLbs"),
  };
}

function _readMoveDirection(
  formData: FormData,
): WorkoutTemplateExerciseMoveDirection {
  const direction = readStringFormValue(formData, "direction");

  if (direction !== "move_up" && direction !== "move_down") {
    throw new Error("Move direction must be move_up or move_down.");
  }

  return direction;
}

function _revalidateTemplateRoutes(templateId: string): void {
  revalidatePath("/templates");
  revalidatePath(`/templates/${templateId}/edit`);
}

function _toFormActionError(error: unknown): FormActionState {
  return {
    status: "error",
    message:
      error instanceof Error ? error.message : "Template update failed.",
  };
}
