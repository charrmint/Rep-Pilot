"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { type FormEvent, useRef, useState } from "react";

import {
  signInWithPassword,
  signUpWithPassword,
} from "@/features/auth/auth-client-service";

import type { AuthMode } from "@/features/auth/types";

export function LoginForm() {
  const router = useRouter();
  const [mode, setMode] = useState<AuthMode>("sign_in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const pending = useRef(false);

  async function _handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending.current) return;
    pending.current = true;
    setErrorMessage(null);
    setStatusMessage(null);
    setIsSubmitting(true);

    try {
      if (mode === "sign_in") {
        await signInWithPassword({ email, password });
        router.replace("/templates");
        router.refresh();
        return;
      }

      const result = await signUpWithPassword({ email, password });

      if (result.hasSession) {
        router.replace("/templates");
        router.refresh();
        return;
      }

      setMode("sign_in");
      setStatusMessage(
        "Account created. Confirm your email, then sign in to continue.",
      );
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Authentication failed.",
      );
    } finally {
      pending.current = false;
      setIsSubmitting(false);
    }
  }

  const isSignIn = mode === "sign_in";

  return (
    <form
      onSubmit={_handleSubmit}
      aria-busy={isSubmitting}
      aria-describedby={errorMessage ? "login-error" : undefined}
      aria-label={isSignIn ? "Sign in" : "Create account"}
      className="v2-card v2-auth-form"
    >
      <div className="v2-auth-modes" role="group" aria-label="Account action">
        <button type="button" className="v2-button v2-button--quiet" disabled={isSubmitting} aria-pressed={isSignIn} onClick={() => { setMode("sign_in"); setErrorMessage(null); setStatusMessage(null); }}>Sign in</button>
        <button type="button" className="v2-button v2-button--quiet" disabled={isSubmitting} aria-pressed={!isSignIn} onClick={() => { setMode("sign_up"); setErrorMessage(null); setStatusMessage(null); }}>Create account</button>
      </div>

      <label className="v2-field">
        Email
        <input
          type="email"
          disabled={isSubmitting}
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          autoComplete="email"
          required
          className="v2-input"
        />
      </label>

      <label className="v2-field">
        Password
        <input
          type="password"
          disabled={isSubmitting}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          autoComplete={isSignIn ? "current-password" : "new-password"}
          minLength={6}
          required
          className="v2-input"
        />
      </label>

      {!isSignIn && <p className="v2-muted">Use at least 6 characters. If email confirmation is required, open the latest link in this browser on this device.</p>}
      {errorMessage ? (
        <p
          id="login-error" role="alert"
          className="v2-auth-notice v2-auth-error"
        >
          {errorMessage}
        </p>
      ) : null}

      {statusMessage ? (
        <p
          role="status"
          className="v2-auth-notice v2-auth-success"
        >
          {statusMessage}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={isSubmitting}
        className="v2-button v2-button--primary"
      >
        {isSubmitting ? "Working..." : isSignIn ? "Sign in" : "Create account"}
      </button>
      {isSignIn ? (
        <Link
          href="/forgot-password"
          className="v2-text-link"
        >
          Forgot password?
        </Link>
      ) : null}
    </form>
  );
}
