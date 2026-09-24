import type { AuthError } from "@supabase/supabase-js";

export function isMissingAuthSession(error: AuthError): boolean {
  return (
    error.name === "AuthSessionMissingError" ||
    [
      "session_not_found",
      "session_expired",
      "refresh_token_not_found",
      "refresh_token_already_used",
      "bad_jwt",
      "user_not_found",
    ].includes(error.code ?? "")
  );
}
