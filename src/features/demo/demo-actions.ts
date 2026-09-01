"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import type { FormActionState } from "@/app/_shared/form-action-state";
import {
  getCurrentUser,
  signInAnonymously,
} from "@/features/auth/auth-server-service";

import { provisionDemoData } from "./demo-service";

export async function startDemoAction(
  _previousState: FormActionState,
  _formData: FormData,
): Promise<FormActionState> {
  void _previousState;
  void _formData;

  const existingUser = await getCurrentUser();

  if (existingUser && !existingUser.is_anonymous) {
    redirect("/templates");
  }

  try {
    const user = existingUser ?? (await signInAnonymously());

    await provisionDemoData({
      isAnonymous: user.is_anonymous === true,
    });
    revalidatePath("/templates");
    revalidatePath("/workouts");
  } catch (error) {
    return {
      status: "error",
      message:
        error instanceof Error
          ? error.message
          : "The demo could not be started. Try again.",
    };
  }

  redirect("/templates");
}
