"use server";

import { updateRecoveredPassword } from "./password-recovery-service";
import type { PasswordResetInput, PasswordResetResult } from "./types";

export async function resetPassword(
  input: PasswordResetInput,
): Promise<PasswordResetResult> {
  try {
    return await updateRecoveredPassword(input);
  } catch {
    // Return safe expected feedback; production Server Actions redact thrown errors.
    return {
      error:
        "Unable to process your reset request. Please try again or request a new reset email.",
    };
  }
}
