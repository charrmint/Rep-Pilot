"use client";

import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";

import {
  signInWithPassword,
  signUpWithPassword,
} from "@/features/auth/auth-client-service";

type AuthMode = "sign_in" | "sign_up";

export function LoginForm() {
  const router = useRouter();
  const [mode, setMode] = useState<AuthMode>("sign_in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
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
      setIsSubmitting(false);
    }
  }

  const isSignIn = mode === "sign_in";

  return (
    <form
      onSubmit={handleSubmit}
      className="flex w-full flex-col gap-4 rounded-md border border-gray-200 bg-white p-5 shadow-sm"
    >
      <div className="grid grid-cols-2 rounded-md bg-gray-100 p-1 text-sm font-medium">
        <button
          type="button"
          onClick={() => setMode("sign_in")}
          className={`rounded px-3 py-2 transition ${
            isSignIn ? "bg-white text-gray-950 shadow-sm" : "text-gray-600"
          }`}
        >
          Sign in
        </button>
        <button
          type="button"
          onClick={() => setMode("sign_up")}
          className={`rounded px-3 py-2 transition ${
            !isSignIn ? "bg-white text-gray-950 shadow-sm" : "text-gray-600"
          }`}
        >
          Create
        </button>
      </div>

      <label className="flex flex-col gap-2 text-sm font-medium text-gray-800">
        Email
        <input
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          autoComplete="email"
          required
          className="rounded-md border border-gray-300 px-3 py-3 text-base text-gray-950 outline-none transition focus:border-gray-950"
        />
      </label>

      <label className="flex flex-col gap-2 text-sm font-medium text-gray-800">
        Password
        <input
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          autoComplete={isSignIn ? "current-password" : "new-password"}
          minLength={6}
          required
          className="rounded-md border border-gray-300 px-3 py-3 text-base text-gray-950 outline-none transition focus:border-gray-950"
        />
      </label>

      {errorMessage ? (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {errorMessage}
        </p>
      ) : null}

      {statusMessage ? (
        <p className="rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
          {statusMessage}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={isSubmitting}
        className="rounded-md bg-gray-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSubmitting
          ? "Working..."
          : isSignIn
            ? "Sign in"
            : "Create account"}
      </button>
    </form>
  );
}
