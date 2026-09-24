"use client";

import { type FormEvent, useState } from "react";

import { requestPasswordReset } from "./auth-client-service";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function _handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);
    setIsSent(false);
    try {
      await requestPasswordReset(email);
      setIsSent(true);
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Unable to send a reset email. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={_handleSubmit}
      className="flex flex-col gap-4 rounded-md border border-gray-200 bg-white p-5 shadow-sm"
    >
      <label className="flex flex-col gap-2 text-sm font-medium text-gray-800">
        Email
        <input
          type="email"
          autoComplete="email"
          required
          value={email}
          disabled={isSubmitting}
          onChange={(event) => {
            setEmail(event.target.value);
            setIsSent(false);
          }}
          className="min-h-12 rounded-md border border-gray-300 px-3 text-base text-gray-950 focus-visible:outline-2 focus-visible:outline-offset-2"
        />
      </label>
      {isSent ? (
        <p
          role="status"
          className="rounded-md bg-green-50 p-3 text-sm text-green-800"
        >
          If an account exists for that email, we’ve sent a password reset link.
          Check your inbox and spam folder. Open the latest link in this browser
          on this device.
        </p>
      ) : null}
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
        {isSubmitting
          ? "Sending..."
          : isSent
            ? "Send another email"
            : "Send reset email"}
      </button>
    </form>
  );
}
