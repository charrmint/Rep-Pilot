import { connection } from "next/server";
import { redirect } from "next/navigation";

import { getCurrentUser } from "@/features/auth/auth-server-service";
import { listWorkoutTemplateLibrary } from "@/features/templates/template-service";

import { AppTopBar } from "../_shared/app-top-bar";
import { CreateTemplateForm } from "./create-template-form";
import { TemplateList } from "./template-list";

export default async function TemplatesPage() {
  await connection();

  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const { activeTemplates, archivedTemplates } =
    await listWorkoutTemplateLibrary(user.id);

  return (
    <main className="min-h-screen bg-gray-50 px-5 py-8">
      <section className="mx-auto flex w-full max-w-3xl flex-col gap-6">
        <AppTopBar activeSection="templates" userEmail={user.email} />

        <header>
          <p className="text-sm font-medium uppercase tracking-wide text-gray-500">
            Workout Templates
          </p>
          <h1 className="mt-2 text-3xl font-semibold text-gray-950">
            Training plans
          </h1>
          <p className="mt-3 max-w-2xl text-base text-gray-600">
            Create reusable workout plans before logging active sessions.
          </p>
        </header>

        <CreateTemplateForm />

        <TemplateList
          title="Active templates"
          description="These templates are available when starting a workout."
          emptyMessage="No active templates yet."
          templates={activeTemplates}
        />

        <TemplateList
          title="Archived templates"
          description="Archived templates stay out of new workout starts but can be restored."
          emptyMessage="No archived templates."
          templates={archivedTemplates}
        />
      </section>
    </main>
  );
}
