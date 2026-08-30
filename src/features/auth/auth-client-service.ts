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
  const emailRedirectTo = `${window.location.origin}/exercises`;

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

  const { error } = await supabase.auth.signOut();

  if (error) {
    throw new Error(error.message);
  }
}
