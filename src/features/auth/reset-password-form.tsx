"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";

import { signOut } from "./auth-client-service";
import { resetPassword } from "./password-recovery-actions";
import type { ResetPasswordFormProps } from "./types";

export function ResetPasswordForm({ email, userId }: ResetPasswordFormProps) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUpdated, setIsUpdated] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  function _returnToSignIn() {
    router.replace("/login?status=password_reset");
    router.refresh();
  }

  async function _handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
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
      setIsSubmitting(false);
    }
  }

  async function _retrySignOut() {
    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      await signOut();
      _returnToSignIn();
    } catch {
      setErrorMessage("Unable to sign out. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isUpdated) {
    return (
      <div className="flex flex-col gap-4 rounded-md border border-gray-200 bg-white p-5">
        <p role="status" className="text-sm text-gray-800">
          Your password has been updated. We couldn’t finish signing you out.
          Retry to end your sessions and sign in with your new password.
        </p>
        {errorMessage ? (
          <p role="alert" className="text-sm text-red-700">
            {errorMessage}
          </p>
        ) : null}
        <button
          type="button"
          onClick={_retrySignOut}
          disabled={isSubmitting}
          className="min-h-12 rounded-md bg-gray-950 px-4 text-sm font-semibold text-white disabled:opacity-60"
        >
          {isSubmitting ? "Signing out..." : "Retry sign out"}
        </button>
      </div>
    );
  }

  return (
    <form
      onSubmit={_handleSubmit}
      className="flex flex-col gap-4 rounded-md border border-gray-200 bg-white p-5 shadow-sm"
    >
      <p className="break-words text-sm text-gray-600">
        Resetting the password for {email}.
      </p>
      <p className="text-sm text-gray-600">
        Save within 15 minutes of opening your email link. This verification can
        be used for one password update attempt.
      </p>
      <label className="flex flex-col gap-2 text-sm font-medium text-gray-800">
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
          className="min-h-12 rounded-md border border-gray-300 px-3 text-base text-gray-950 focus-visible:outline-2 focus-visible:outline-offset-2"
        />
      </label>
      <p id="password-help" className="text-sm text-gray-600">
        Use at least 6 characters. A long, unique password is best.
      </p>
      <label className="flex flex-col gap-2 text-sm font-medium text-gray-800">
        Confirm new password
        <input
          type="password"
          autoComplete="new-password"
          minLength={6}
          required
          value={confirmation}
          disabled={isSubmitting}
          onChange={(event) => setConfirmation(event.target.value)}
          className="min-h-12 rounded-md border border-gray-300 px-3 text-base text-gray-950 focus-visible:outline-2 focus-visible:outline-offset-2"
        />
      </label>
      <p className="text-sm text-gray-600">
        After saving, you’ll be signed out of your sessions and asked to sign in
        again.
      </p>
      {errorMessage ? (
        <p role="alert" className="text-sm text-red-700">
          {errorMessage}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={isSubmitting}
        className="min-h-12 rounded-md bg-gray-950 px-4 text-sm font-semibold text-white disabled:opacity-60"
      >
        {isSubmitting ? "Updating password..." : "Update password"}
      </button>
      <Link
        href="/forgot-password"
        className="py-2 text-center text-sm font-semibold text-gray-700 underline"
      >
        Request a new reset email
      </Link>
    </form>
  );
}
