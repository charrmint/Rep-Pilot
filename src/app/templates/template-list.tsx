import Link from "next/link";

import type { WorkoutTemplateDetails } from "@/features/templates/types";
import { StartWorkoutControl } from "@/features/workouts/components/start-workout-control";
import type { ActiveWorkoutSummary } from "@/features/workouts/types";

import { TemplateArchiveControl } from "./template-archive-control";
import { TemplateExercisePreview } from "./template-exercise-preview";

interface TemplateListProps {
  title: string;
  description: string;
  emptyMessage: string;
  templates: WorkoutTemplateDetails[];
  activeWorkout: ActiveWorkoutSummary | null;
}

const DATE_FORMATTER = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

export function TemplateList({
  title,
  description,
  emptyMessage,
  templates,
  activeWorkout,
}: TemplateListProps) {
  return (
    <section className="flex flex-col gap-3">
      <div>
        <h2 className="text-lg font-semibold text-gray-950">{title}</h2>
        <p className="mt-1 text-sm text-gray-600">{description}</p>
      </div>

      {templates.length === 0 ? (
        <div className="rounded-md border border-gray-200 bg-white px-4 py-5 text-sm text-gray-600">
          {emptyMessage}
        </div>
      ) : (
        <ul className="divide-y divide-gray-200 rounded-md border border-gray-200 bg-white">
          {templates.map((template) => (
            <li
              key={template.id}
              className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-start sm:justify-between"
            >
              <details className="min-w-0 flex-1">
                <summary className="cursor-pointer list-none rounded-md outline-none transition focus-visible:ring-2 focus-visible:ring-gray-950">
                  <div className="flex min-w-0 items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-medium text-gray-950">
                        {template.name}
                      </p>
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <span
                          className={`rounded-full px-2 py-1 text-xs font-medium ${
                            template.isArchived
                              ? "bg-amber-50 text-amber-700"
                              : "bg-green-50 text-green-700"
                          }`}
                        >
                          {template.isArchived ? "Archived" : "Active"}
                        </span>
                        <span className="text-xs text-gray-500">
                          {_formatExerciseCount(template.exercises.length)}
                        </span>
                        <time
                          dateTime={template.updatedAt}
                          className="text-xs text-gray-500"
                        >
                          Updated {_formatTemplateDate(template.updatedAt)}
                        </time>
                      </div>
                    </div>
                    <span className="shrink-0 text-sm font-medium text-gray-500">
                      View
                    </span>
                  </div>
                </summary>

                <TemplateExercisePreview exercises={template.exercises} />
              </details>

              <div className="flex w-full flex-wrap items-start gap-2 sm:w-auto sm:shrink-0 sm:justify-end">
                <Link
                  href={`/workouts/templates/${template.id}`}
                  className="min-h-10 rounded-md border border-gray-300 px-3 py-2 text-sm font-semibold text-gray-700 transition hover:border-gray-500 hover:text-gray-950"
                >
                  History
                </Link>
                {!template.isArchived ? (
                  <>
                    <StartWorkoutControl
                      templateId={template.id}
                      hasExercises={template.exercises.length > 0}
                      activeWorkout={activeWorkout}
                    />
                    <Link
                      href={`/templates/${template.id}/edit`}
                      className="min-h-10 rounded-md bg-gray-950 px-3 py-2 text-sm font-semibold text-white transition hover:bg-gray-800"
                    >
                      Edit
                    </Link>
                  </>
                ) : null}
                <TemplateArchiveControl
                  templateId={template.id}
                  isArchived={template.isArchived}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function _formatTemplateDate(date: string): string {
  return DATE_FORMATTER.format(new Date(date));
}

function _formatExerciseCount(count: number): string {
  if (count === 1) {
    return "1 exercise";
  }

  return `${count} exercises`;
}
