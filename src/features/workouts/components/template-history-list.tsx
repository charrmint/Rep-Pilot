import Link from "next/link";

import type { TemplateHistorySummary } from "../types";
import { LocalDateTime } from "./local-date-time";

interface TemplateHistoryListProps {
  templates: TemplateHistorySummary[];
}

export function TemplateHistoryList({ templates }: TemplateHistoryListProps) {
  if (templates.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-5 text-sm text-gray-600">
        No template workout history yet.
      </div>
    );
  }

  return (
    <ul className="grid gap-3 sm:grid-cols-2">
      {templates.map((template) => (
        <li key={template.templateId}>
          <Link
            href={`/workouts/templates/${template.templateId}`}
            className="flex h-full flex-col rounded-lg border border-gray-200 bg-white p-4 shadow-sm transition hover:border-gray-400 hover:shadow"
          >
            <div className="flex items-start justify-between gap-3">
              <h2 className="min-w-0 truncate text-lg font-semibold text-gray-950">
                {template.templateName}
              </h2>
              <span aria-hidden="true" className="text-gray-400">
                ›
              </span>
            </div>
            <p className="mt-2 text-sm text-gray-600">
              Last performed{" "}
              <LocalDateTime
                value={template.lastPerformedAt}
                dateStyle="medium"
              />
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-gray-100 px-2 py-1 text-xs font-semibold text-gray-700">
                {_formatWorkoutCount(template.workoutCount)}
              </span>
              {template.isArchived ? (
                <span className="rounded-full bg-amber-50 px-2 py-1 text-xs font-semibold text-amber-700">
                  Archived
                </span>
              ) : null}
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}

function _formatWorkoutCount(count: number): string {
  return count === 1 ? "1 workout" : `${count} workouts`;
}
