import type { Exercise } from "@/features/exercises/types";

import { ExerciseArchiveControl } from "./exercise-archive-control";

interface ExerciseListProps {
  title: string;
  description: string;
  emptyMessage: string;
  exercises: Exercise[];
}

export function ExerciseList({
  title,
  description,
  emptyMessage,
  exercises,
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
            <li
              key={exercise.id}
              className="flex items-center justify-between gap-4 px-4 py-3"
            >
              <div className="min-w-0">
                <p className="truncate font-medium text-gray-950">
                  {exercise.name}
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
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

              {exercise.isSystemExercise ? null : (
                <ExerciseArchiveControl
                  exerciseId={exercise.id}
                  isArchived={exercise.isArchived}
                />
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
