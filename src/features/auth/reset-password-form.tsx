"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, useRef, useState } from "react";

import { signOut } from "./auth-client-service";
import { resetPassword } from "./password-recovery-actions";
import type { ResetPasswordFormProps } from "./types";

export function ResetPasswordForm({ email, userId }: ResetPasswordFormProps) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const pending = useRef(false);
  const [isUpdated, setIsUpdated] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  function _returnToSignIn() {
    router.replace("/login?status=password_reset");
    router.refresh();
  }

  async function _handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending.current) return;
    pending.current = true;
    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      const result = await resetPassword({ userId, password, confirmation });
      if (result.error) {
        setErrorMessage(result.error);
        return;
      }
      setPassword("");
      setConfirmation("");
      if (result.signedOut) {
        _returnToSignIn();
      } else {
        setIsUpdated(true);
      }
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Unable to update your password. Please try again.",
      );
    } finally {
      pending.current = false;
      setIsSubmitting(false);
    }
  }

  async function _retrySignOut() {
    if (pending.current) return;
    pending.current = true;
    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      await signOut();
      _returnToSignIn();
    } catch {
      setErrorMessage("Unable to sign out. Please try again.");
    } finally {
      pending.current = false;
      setIsSubmitting(false);
    }
  }

  if (isUpdated) {
    return (
      <div className="v2-card v2-auth-form">
        <p role="status" className="v2-muted">
          Your password has been updated. We couldn’t finish signing you out.
          Retry to end your sessions and sign in with your new password.
        </p>
        {errorMessage ? (
          <p id="reset-error" role="alert" className="v2-auth-notice v2-auth-error">
            {errorMessage}
          </p>
        ) : null}
        <button
          type="button"
          onClick={_retrySignOut}
          disabled={isSubmitting}
          className="v2-button v2-button--primary"
        >
          {isSubmitting ? "Signing out..." : "Retry sign out"}
        </button>
      </div>
    );
  }

  return (
    <form
      onSubmit={_handleSubmit}
      aria-busy={isSubmitting}
      aria-describedby={errorMessage ? "reset-error" : undefined}
      className="v2-card v2-auth-form"
    >
      <p className="v2-muted">
        Resetting the password for {email}.
      </p>
      <p className="v2-muted">
        Save within 15 minutes of opening your email link. This verification can
        be used for one password update attempt.
      </p>
      <label className="v2-field">
        New password
        <input
          type="password"
          autoComplete="new-password"
          minLength={6}
          required
          value={password}
          disabled={isSubmitting}
          onChange={(event) => setPassword(event.target.value)}
          aria-describedby="password-help"
          className="v2-input"
        />
      </label>
      <p id="password-help" className="v2-muted">
        Use at least 6 characters. A long, unique password is best.
      </p>
      <label className="v2-field">
        Confirm new password
        <input
          type="password"
          autoComplete="new-password"
          minLength={6}
          required
          value={confirmation}
          disabled={isSubmitting}
          onChange={(event) => setConfirmation(event.target.value)}
          className="v2-input"
        />
      </label>
      <p className="v2-muted">
        After saving, you’ll be signed out of your sessions and asked to sign in
        again.
      </p>
      {errorMessage ? (
        <p id="reset-error" role="alert" className="v2-auth-notice v2-auth-error">
          {errorMessage}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={isSubmitting}
        className="v2-button v2-button--primary"
      >
        {isSubmitting ? "Updating password..." : "Update password"}
      </button>
      <Link
        href="/forgot-password"
        className="v2-text-link"
      >
        Request a new reset email
      </Link>
    </form>
  );
}
