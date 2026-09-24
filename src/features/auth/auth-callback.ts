import { NextResponse } from "next/server";

import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function handleAuthCallback(
  request: Request,
): Promise<NextResponse> {
  const url = new URL(request.url);
  // Only fixed application destinations are accepted, never an arbitrary next URL.
  const isRecovery = url.searchParams.get("next") === "/reset-password";
  const failurePath = isRecovery
    ? "/forgot-password?error=invalid_link"
    : "/login?error=invalid_link";
  const code = url.searchParams.get("code");
  let destination = failurePath;

  if (code && !url.searchParams.has("error")) {
    try {
      const supabase = await createSupabaseServerClient();
      const { data, error } = await supabase.auth.exchangeCodeForSession(code);
      if (!error && data.session && data.user && !data.user.is_anonymous) {
        destination = isRecovery ? "/reset-password" : "/templates";
      }
    } catch {
      // Never forward provider errors or credentials into a redirect URL.
    }
  }

  const response = NextResponse.redirect(new URL(destination, url.origin), 303);
  response.headers.set("Cache-Control", "private, no-store");
  response.headers.set("Referrer-Policy", "no-referrer");
  return response;
}
