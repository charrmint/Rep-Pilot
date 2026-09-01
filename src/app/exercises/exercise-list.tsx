import Link from "next/link";

import type { Exercise } from "@/features/exercises/types";
import type { WorkoutTemplateDetails } from "@/features/templates/types";

import { AddExerciseToTemplateControl } from "./add-exercise-to-template-control";
import { ExerciseArchiveControl } from "./exercise-archive-control";

interface ExerciseListProps {
  title: string;
  description: string;
  emptyMessage: string;
  exercises: Exercise[];
  activeTemplates: WorkoutTemplateDetails[];
  allowTemplateAssignment?: boolean;
}

export function ExerciseList({
  title,
  description,
  emptyMessage,
  exercises,
  activeTemplates,
  allowTemplateAssignment = false,
}: ExerciseListProps) {
  return (
    <section className="flex flex-col gap-3">
      <div>
        <h2 className="text-lg font-semibold text-gray-950">{title}</h2>
        <p className="mt-1 text-sm text-gray-600">{description}</p>
      </div>

      {exercises.length === 0 ? (
        <div className="rounded-md border border-gray-200 bg-white px-4 py-5 text-sm text-gray-600">
          {emptyMessage}
        </div>
      ) : (
        <ul className="divide-y divide-gray-200 rounded-md border border-gray-200 bg-white">
          {exercises.map((exercise) => (
            <li key={exercise.id} className="px-4 py-4">
              <div className="flex items-start justify-between gap-4">
                <p className="min-w-0 flex-1 truncate font-medium text-gray-950">
                  {exercise.name}
                </p>
                <div className="flex shrink-0 flex-wrap justify-end gap-2">
                  {exercise.isSystemExercise ? (
                    <span className="rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-600">
                      System
                    </span>
                  ) : (
                    <span className="rounded-full bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700">
                      Custom
                    </span>
                  )}
                  {exercise.isArchived ? (
                    <span className="rounded-full bg-amber-50 px-2 py-1 text-xs font-medium text-amber-700">
                      Archived
                    </span>
                  ) : null}
                </div>
              </div>

              <div className="mt-4 flex flex-wrap items-start gap-2">
                <Link
                  href={`/workouts/exercises/${exercise.id}`}
                  className="flex min-h-10 items-center justify-center rounded-md border border-gray-300 px-3 text-sm font-semibold text-gray-700 transition hover:border-gray-500 hover:text-gray-950"
                >
                  History
                </Link>
                {allowTemplateAssignment ? (
                  <AddExerciseToTemplateControl
                    exerciseId={exercise.id}
                    templates={activeTemplates}
                  />
                ) : null}
                {exercise.isSystemExercise ? null : (
                  <ExerciseArchiveControl
                    exerciseId={exercise.id}
                    isArchived={exercise.isArchived}
                  />
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
