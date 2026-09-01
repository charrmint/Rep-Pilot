"use client";

import Link from "next/link";
import { useActionState } from "react";

import { INITIAL_FORM_ACTION_STATE } from "@/app/_shared/form-action-state";
import type { WorkoutTemplateDetails } from "@/features/templates/types";

import { addExerciseToWorkoutTemplateAction } from "./actions";

interface AddExerciseToTemplateControlProps {
  exerciseId: string;
  templates: WorkoutTemplateDetails[];
}

export function AddExerciseToTemplateControl({
  exerciseId,
  templates,
}: AddExerciseToTemplateControlProps) {
  const [state, formAction, isPending] = useActionState(
    addExerciseToWorkoutTemplateAction,
    INITIAL_FORM_ACTION_STATE,
  );
  const addableTemplates = templates.filter(
    (template) =>
      !template.exercises.some(
        (templateExercise) => templateExercise.exerciseId === exerciseId,
      ),
  );

  if (templates.length === 0) {
    return (
      <Link
        href="/templates"
        className="flex min-h-10 items-center justify-center rounded-md border border-gray-300 px-3 text-sm font-semibold text-gray-700 transition hover:border-gray-500 hover:text-gray-950"
      >
        Create template
      </Link>
    );
  }

  if (addableTemplates.length === 0) {
    return (
      <span className="flex min-h-10 items-center rounded-md bg-green-50 px-3 text-sm font-semibold text-green-700">
        Added to all
      </span>
    );
  }

  return (
    <details className="group w-auto open:w-full">
      <summary className="flex min-h-10 w-fit cursor-pointer list-none items-center justify-center rounded-md border border-gray-300 px-3 text-sm font-semibold text-gray-700 transition hover:border-gray-500 hover:text-gray-950 [&::-webkit-details-marker]:hidden">
        Add to template
      </summary>

      <form
        action={formAction}
        className="mt-2 w-full rounded-md border border-gray-200 bg-white p-3 shadow-sm"
      >
        <input type="hidden" name="exerciseId" value={exerciseId} />

        <label className="flex flex-col gap-2 text-sm font-medium text-gray-800">
          Template
          <select
            name="templateId"
            className="min-h-11 rounded-md border border-gray-300 bg-white px-3 text-base text-gray-950 outline-none transition focus:border-gray-950"
          >
            {addableTemplates.map((template) => (
              <option key={template.id} value={template.id}>
                {template.name}
              </option>
            ))}
          </select>
        </label>

        <p className="mt-3 text-xs leading-5 text-gray-600">
          Starts at 3 sets of 8–12 reps with 0 lb. Adjust it in the template
          builder.
        </p>

        {state.message ? (
          <p
            className={`mt-3 rounded-md border px-3 py-2 text-sm ${
              state.status === "error"
                ? "border-red-200 bg-red-50 text-red-700"
                : "border-green-200 bg-green-50 text-green-700"
            }`}
          >
            {state.message}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={isPending}
          className="mt-3 min-h-11 w-full rounded-md bg-gray-950 px-3 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isPending ? "Adding..." : "Add exercise"}
        </button>
      </form>
    </details>
  );
}
