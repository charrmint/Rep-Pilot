import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isMissingAuthSession } from "./auth-errors";
import { hasFreshRecoveryClaims } from "./recovery-claims";
import type { PasswordResetInput, PasswordResetResult } from "./types";

export async function getPasswordRecoveryUser(
  client?: Awaited<ReturnType<typeof createSupabaseServerClient>>,
) {
  const supabase = client ?? (await createSupabaseServerClient());
  const { data, error } = await supabase.auth.getUser();
  if (error && !isMissingAuthSession(error)) {
    throw new Error("Unable to check your session. Please try again.");
  }
  if (error || !data.user || data.user.is_anonymous || !data.user.email)
    return null;
  const { data: verified, error: claimsError } =
    await supabase.auth.getClaims();
  if (
    claimsError ||
    !verified ||
    !hasFreshRecoveryClaims(verified.claims, data.user.id)
  ) {
    return null;
  }
  return data.user;
}

export async function updateRecoveredPassword({
  userId,
  password,
  confirmation,
}: PasswordResetInput): Promise<PasswordResetResult> {
  if (typeof password !== "string" || password.length < 6) {
    return { error: "Use at least 6 characters for your password." };
  }
  if (password !== confirmation)
    return { error: "The passwords do not match." };

  const supabase = await createSupabaseServerClient();
  const user = await getPasswordRecoveryUser(supabase);
  if (!user)
    return {
      error: "Your reset session has expired. Request a new reset email.",
    };
  if (user.id !== userId) {
    return {
      error: "Your signed-in account has changed. Request a new reset email.",
    };
  }

  // Atomically consume before updating: concurrent/replayed submissions fail closed.
  // An uncertain or rejected provider update requires another recovery email.
  const { data: consumed, error: consumeError } = await supabase.rpc(
    "consume_password_recovery",
  );
  if (consumeError)
    return {
      error: "Unable to verify your reset request. Request a new reset email.",
    };
  if (!consumed)
    return {
      error:
        "This reset session has expired or already been used. Request a new reset email.",
    };

  let updateError;
  try {
    ({ error: updateError } = await supabase.auth.updateUser({ password }));
  } catch {
    return {
      error:
        "We couldn’t confirm the password update. Try signing in, or request a new reset email.",
    };
  }
  if (updateError) {
    const message =
      updateError.code === "same_password"
        ? "Choose a password different from your current password."
        : updateError.code === "weak_password"
          ? "Choose a stronger password."
          : "Unable to update your password.";
    return { error: `${message} Request a new reset email.` };
  }
  try {
    const { error } = await supabase.auth.signOut({ scope: "global" });
    return { signedOut: !error };
  } catch {
    return { signedOut: false };
  }
}
