import type { JwtPayload } from "@supabase/supabase-js";

// Check only claims returned by Supabase getClaims(), never decoded browser input.
export function hasFreshRecoveryClaims(
  claims: JwtPayload,
  userId: string,
  now = Date.now() / 1000,
): boolean {
  return (
    claims.sub === userId &&
    typeof claims.session_id === "string" &&
    claims.session_id.length > 0 &&
    claims.is_anonymous !== true &&
    Array.isArray(claims.amr) &&
    claims.amr.some(
      (entry) =>
        typeof entry === "object" &&
        entry !== null &&
        entry?.method === "recovery" &&
        Number.isFinite(entry.timestamp) &&
        entry.timestamp <= now &&
        entry.timestamp > now - 15 * 60,
    )
  );
}
