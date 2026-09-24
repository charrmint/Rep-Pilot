import { connection } from "next/server";
import { redirect } from "next/navigation";

import { AuthPageShell } from "@/features/auth/auth-page-shell";
import { getPasswordRecoveryUser } from "@/features/auth/password-recovery-service";
import { ResetPasswordForm } from "@/features/auth/reset-password-form";

export default async function ResetPasswordPage() {
  await connection();
  const user = await getPasswordRecoveryUser();
  if (!user || user.is_anonymous || !user.email) {
    redirect("/forgot-password?error=invalid_link");
  }
  return (
    <AuthPageShell
      title="Choose a new password"
      description="Save a new password to regain access to your account."
    >
      <ResetPasswordForm email={user.email} userId={user.id} />
    </AuthPageShell>
  );
}
