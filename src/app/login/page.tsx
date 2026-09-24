import { connection } from "next/server";
import { redirect } from "next/navigation";

import { getCurrentUser } from "@/features/auth/auth-server-service";
import type { AuthPageProps } from "@/features/auth/types";
import { DemoEntryForm } from "@/features/demo/demo-entry-form";

import { LoginForm } from "./login-form";

export default async function LoginPage({ searchParams }: AuthPageProps) {
  await connection();

  const user = await getCurrentUser();
  const { error, status } = await searchParams;

  if (user && !user.is_anonymous && error !== "invalid_link") {
    redirect("/templates");
  }

  return (
    <main className="min-h-screen bg-gray-50 px-5 py-10">
      <section className="mx-auto flex w-full max-w-md flex-col gap-6">
        <header>
          <p className="text-sm font-medium uppercase tracking-wide text-gray-500">
            RepPilot
          </p>
          <h1 className="mt-2 text-3xl font-semibold text-gray-950">
            Sign in to continue
          </h1>
          <p className="mt-3 text-base text-gray-600">
            Use your account, or explore the complete app with a private demo
            session.
          </p>
        </header>

        <div className="rounded-md border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-semibold text-gray-950">
            No account? No problem.
          </p>
          <p className="mt-1 mb-4 text-sm text-gray-600">
            Open RepPilot with templates and workout history ready to explore.
          </p>
          <DemoEntryForm />
        </div>

        <div className="flex items-center gap-3 text-xs font-semibold uppercase tracking-wide text-gray-400">
          <span className="h-px flex-1 bg-gray-200" />
          Or sign in
          <span className="h-px flex-1 bg-gray-200" />
        </div>

        {error === "invalid_link" ? (
          <p
            role="alert"
            className="rounded-md bg-amber-50 p-3 text-sm text-amber-900"
          >
            This confirmation link is expired, already used, or couldn’t be
            verified. Try signing in if you already confirmed your email.
            Otherwise, create your account again to request a new confirmation
            and open the latest link in the same browser and device.
          </p>
        ) : null}
        {status === "password_reset" ? (
          <p
            role="status"
            className="rounded-md bg-green-50 p-3 text-sm text-green-800"
          >
            Password updated. Sign in with your new password.
          </p>
        ) : null}
        <LoginForm />
      </section>
    </main>
  );
}
