import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { connection } from "next/server";

import { AppTopBar } from "@/app/_shared/app-top-bar";
import { getCurrentUser } from "@/features/auth/auth-server-service";
import { listAvailableExercises } from "@/features/exercises/exercise-service";
import { getWorkoutTemplateDetails } from "@/features/templates/template-service";

import { AddTemplateExerciseForm } from "./add-template-exercise-form";
import { RenameTemplateForm } from "./rename-template-form";
import { TemplateExerciseConfigCard } from "./template-exercise-config-card";

interface EditTemplatePageProps {
  params: Promise<{
    templateId: string;
  }>;
}

export default async function EditTemplatePage({
  params,
}: EditTemplatePageProps) {
  await connection();

  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const { templateId } = await params;
  const [template, activeExercises] = await Promise.all([
    getWorkoutTemplateDetails({ userId: user.id, templateId }),
    listAvailableExercises(),
  ]);

  if (!template) {
    notFound();
  }

  const configuredExerciseIds = new Set(
    template.exercises.map((exercise) => exercise.exerciseId),
  );
  const addableExercises = activeExercises.filter(
    (exercise) => !configuredExerciseIds.has(exercise.id),
  );

  return (
    <main className="min-h-screen bg-gray-50 px-5 py-8">
      <section className="mx-auto flex w-full max-w-3xl flex-col gap-6">
        <AppTopBar activeSection="templates" userEmail={user.email} />

        <header>
          <Link
            href="/templates"
            className="text-sm font-semibold text-gray-600 transition hover:text-gray-950"
          >
            Back to templates
          </Link>
          <p className="mt-4 text-sm font-medium uppercase tracking-wide text-gray-500">
            Template Builder
          </p>
          <h1 className="mt-2 text-3xl font-semibold text-gray-950">
            {template.name}
          </h1>
          <p className="mt-3 max-w-2xl text-base text-gray-600">
            Configure the exercise order and default set targets for this
            workout template.
          </p>
        </header>

        <RenameTemplateForm templateId={template.id} name={template.name} />

        <section className="flex flex-col gap-3">
          <div>
            <h2 className="text-lg font-semibold text-gray-950">
              Template exercises
            </h2>
            <p className="mt-1 text-sm text-gray-600">
              These settings prepare the future active workout logging flow.
            </p>
          </div>

          {template.exercises.length === 0 ? (
            <div className="rounded-md border border-gray-200 bg-white px-4 py-5 text-sm text-gray-600">
              No exercises added yet.
            </div>
          ) : (
            <ol className="flex flex-col gap-4">
              {template.exercises.map((exercise, index) => (
                <TemplateExerciseConfigCard
                  key={exercise.id}
                  exercise={exercise}
                  isFirst={index === 0}
                  isLast={index === template.exercises.length - 1}
                />
              ))}
            </ol>
          )}
        </section>

        <AddTemplateExerciseForm
          templateId={template.id}
          exercises={addableExercises}
        />
      </section>
    </main>
  );
}
