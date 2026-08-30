import { redirect } from "next/navigation";

import { getCurrentUser } from "@/features/auth/auth-server-service";

import { LoginForm } from "./login-form";

export default async function LoginPage() {
  const user = await getCurrentUser();

  if (user) {
    redirect("/exercises");
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
            Use an email and password to start testing your workout data behind
            Supabase RLS.
          </p>
        </header>

        <LoginForm />
      </section>
    </main>
  );
}
