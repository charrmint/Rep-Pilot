import type { AuthUser } from "@supabase/supabase-js";

import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function getCurrentUser(): Promise<AuthUser | null> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase.auth.getUser();

  if (error) {
    if (error.name === "AuthSessionMissingError") {
      return null;
    }

    throw new Error(`Failed to get current user: ${error.message}`);
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
