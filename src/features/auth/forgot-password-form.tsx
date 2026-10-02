"use client";

import { type FormEvent, useRef, useState } from "react";

import { requestPasswordReset } from "./auth-client-service";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const pending = useRef(false);
  const [isSent, setIsSent] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function _handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending.current) return;
    pending.current = true;
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
      pending.current = false;
      setIsSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={_handleSubmit}
      aria-busy={isSubmitting}
      aria-describedby={errorMessage ? "forgot-error" : undefined}
      className="v2-card v2-auth-form"
    >
      <label className="v2-field">
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
          className="v2-input"
        />
      </label>
      {isSent ? (
        <p
          role="status"
          className="v2-auth-notice v2-auth-success"
        >
          If an account exists for that email, we’ve sent a password reset link.
          Check your inbox and spam folder. Open the latest link in this browser
          on this device.
        </p>
      ) : null}
      {errorMessage ? (
        <p id="forgot-error" role="alert" className="v2-auth-notice v2-auth-error">
          {errorMessage}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={isSubmitting}
        className="v2-button v2-button--primary"
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
