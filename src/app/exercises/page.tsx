import { listAvailableExercises } from "@/features/exercises/exercise-service";

export default async function ExercisesPage() {
  const exercises = await listAvailableExercises();

  return (
    <main className="min-h-screen px-5 py-8">
      <section className="mx-auto flex w-full max-w-3xl flex-col gap-6">
        <header>
          <p className="text-sm font-medium uppercase tracking-wide text-gray-500">
            Exercise Library
          </p>
          <h1 className="mt-2 text-3xl font-semibold text-gray-950">
            Strength exercises
          </h1>
        </header>

        {exercises.length === 0 ? (
          <div className="rounded-md border border-gray-200 bg-white px-4 py-5 text-sm text-gray-600">
            No exercises found.
          </div>
        ) : null}

        {exercises.length > 0 ? (
          <ul className="divide-y divide-gray-200 rounded-md border border-gray-200 bg-white">
            {exercises.map((exercise) => (
              <li
                key={exercise.id}
                className="flex items-center justify-between gap-4 px-4 py-3"
              >
                <span className="font-medium text-gray-950">{exercise.name}</span>
                {exercise.isSystemExercise ? (
                  <span className="rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-600">
                    System
                  </span>
                ) : null}
              </li>
            ))}
          </ul>
        ) : null}
      </section>
    </main>
  );
}
