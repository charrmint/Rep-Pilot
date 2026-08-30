import type { WorkoutTemplate } from "@/features/templates/types";

import { TemplateArchiveControl } from "./template-archive-control";

interface TemplateListProps {
  title: string;
  description: string;
  emptyMessage: string;
  templates: WorkoutTemplate[];
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
              className="flex items-center justify-between gap-4 px-4 py-3"
            >
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
                  <time
                    dateTime={template.updatedAt}
                    className="text-xs text-gray-500"
                  >
                    Updated {_formatTemplateDate(template.updatedAt)}
                  </time>
                </div>
              </div>

              <TemplateArchiveControl
                templateId={template.id}
                isArchived={template.isArchived}
              />
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
