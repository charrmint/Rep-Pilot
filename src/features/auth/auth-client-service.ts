"use client";

import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

import type {
  PasswordAuthCredentials,
  PasswordResetInput,
  PasswordResetResult,
  SignUpResult,
} from "./types";
import { isMissingAuthSession } from "./auth-errors";

export async function signInWithPassword(
  credentials: PasswordAuthCredentials,
): Promise<void> {
  const supabase = createSupabaseBrowserClient();

  const { error } = await supabase.auth.signInWithPassword(credentials);

  if (error) {
    throw new Error(error.message);
  }
}

export async function signUpWithPassword(
  credentials: PasswordAuthCredentials,
): Promise<SignUpResult> {
  const supabase = createSupabaseBrowserClient();
  const emailRedirectTo = `${window.location.origin}/auth/callback`;

  const { data, error } = await supabase.auth.signUp({
    ...credentials,
    options: {
      emailRedirectTo,
    },
  });

  if (error) {
    throw new Error(error.message);
  }

  return {
    hasSession: data.session !== null,
  };
}

export async function signOut(): Promise<void> {
  const supabase = createSupabaseBrowserClient();

  const { error } = await supabase.auth.signOut({ scope: "global" });

  if (error) {
    throw new Error("Unable to sign out. Please try again.");
  }
}

export async function requestPasswordReset(email: string): Promise<void> {
  const supabase = createSupabaseBrowserClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
    redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
  });

  if (error) {
    throw new Error(
      error.code === "over_email_send_rate_limit" || error.status === 429
        ? "Please wait before requesting another reset email."
        : "Unable to send a reset email. Please try again.",
    );
  }
}

export async function resetPassword({
  userId,
  password,
  confirmation,
}: PasswordResetInput): Promise<PasswordResetResult> {
  if (password.length < 6) {
    throw new Error("Use at least 6 characters for your password.");
  }
  if (password !== confirmation) {
    throw new Error("The passwords do not match.");
  }

  const supabase = createSupabaseBrowserClient();
  const { data, error: sessionError } = await supabase.auth.getUser();

  if (sessionError && !isMissingAuthSession(sessionError)) {
    throw new Error("Unable to check your session. Please try again.");
  }
  if (sessionError || !data.user || data.user.is_anonymous) {
    throw new Error(
      "Your reset session has expired. Request a new reset email.",
    );
  }
  if (data.user.id !== userId) {
    throw new Error(
      "Your signed-in account has changed. Request a new reset email.",
    );
  }

  const { error } = await supabase.auth.updateUser({ password });
  if (error) {
    if (error.code === "same_password") {
      throw new Error(
        "Choose a password different from your current password.",
      );
    }
    if (error.code === "weak_password") {
      throw new Error("Choose a stronger password and try again.");
    }
    if (isMissingAuthSession(error)) {
      throw new Error(
        "Your reset session has expired. Request a new reset email.",
      );
    }
    throw new Error("Unable to update your password. Please try again.");
  }

  // A sign-out failure must not be reported as a failed password change.
  try {
    await signOut();
    return { signedOut: true };
  } catch {
    return { signedOut: false };
  }
}
