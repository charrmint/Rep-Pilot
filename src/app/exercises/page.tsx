import { connection } from "next/server";
import { redirect } from "next/navigation";

import { getCurrentUser } from "@/features/auth/auth-server-service";
import { listExerciseLibrary } from "@/features/exercises/exercise-service";
import { listWorkoutTemplateLibrary } from "@/features/templates/template-service";

import { AppTopBar } from "../_shared/app-top-bar";
import { CreateExerciseForm } from "./create-exercise-form";
import { ExerciseLibrary } from "./exercise-library";

export default async function ExercisesPage() {
  await connection();

  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const [exerciseLibrary, { activeTemplates }] = await Promise.all([
    listExerciseLibrary(),
    listWorkoutTemplateLibrary(user.id),
  ]);

  return (
    <main className="min-h-screen bg-gray-50 px-5 py-8">
      <section className="mx-auto flex w-full max-w-3xl flex-col gap-6">
        <AppTopBar activeSection="exercises" userEmail={user.email} />

        <header>
          <div>
            <p className="text-sm font-medium uppercase tracking-wide text-gray-500">
              Exercise Library
            </p>
            <h1 className="mt-2 text-3xl font-semibold text-gray-950">
              Strength exercises
            </h1>
            <p className="mt-3 max-w-2xl text-base text-gray-600">
              System exercises are shared defaults. Custom exercises belong to
              your account and can be archived when you no longer use them.
            </p>
          </div>
        </header>

        <CreateExerciseForm />

        <ExerciseLibrary
          library={exerciseLibrary}
          activeTemplates={activeTemplates}
        />
      </section>
    </main>
  );
}
