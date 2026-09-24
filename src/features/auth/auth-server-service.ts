import type { AuthUser } from "@supabase/supabase-js";

import { createSupabaseServerClient } from "@/lib/supabase/server";

import { isMissingAuthSession } from "./auth-errors";

export async function getCurrentUser(): Promise<AuthUser | null> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase.auth.getUser();

  if (error) {
    if (isMissingAuthSession(error)) {
      return null;
    }

    throw new Error("Unable to check your session. Please try again.");
  }

  return data.user;
}

export async function signInAnonymously(): Promise<AuthUser> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signInAnonymously();

  if (error) {
    throw new Error(`Failed to start demo session: ${error.message}`);
  }

  if (!data.user) {
    throw new Error("Failed to start demo session.");
  }

  return data.user;
}
