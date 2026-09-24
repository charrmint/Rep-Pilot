"use client";

import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

import type { PasswordAuthCredentials, SignUpResult } from "./types";

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
