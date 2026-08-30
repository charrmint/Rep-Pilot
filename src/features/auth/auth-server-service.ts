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
