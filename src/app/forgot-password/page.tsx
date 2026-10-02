import { AuthPageShell } from "@/features/auth/auth-page-shell";
import { ForgotPasswordForm } from "@/features/auth/forgot-password-form";
import type { AuthPageProps } from "@/features/auth/types";

export default async function ForgotPasswordPage({
  searchParams,
}: AuthPageProps) {
  const { error } = await searchParams;
  return (
    <AuthPageShell
      title="Reset your password"
      description="Enter your account email and we’ll send you a reset link."
    >
      {error === "invalid_link" ? (
        <p
          role="alert"
          className="v2-auth-notice v2-auth-error"
        >
          This reset link is expired, already used, or couldn’t be verified.
          Request a new email and open the latest link in the same browser and
          device where you requested it.
        </p>
      ) : null}
      <ForgotPasswordForm />
    </AuthPageShell>
  );
}
