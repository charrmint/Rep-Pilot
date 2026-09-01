"use client";

import { useActionState } from "react";

import { INITIAL_FORM_ACTION_STATE } from "@/app/_shared/form-action-state";
import type { Exercise } from "@/features/exercises/types";
import { ExercisePicker } from "@/features/templates/components/exercise-picker";
import { DEFAULT_WORKOUT_TEMPLATE_EXERCISE_CONFIG } from "@/features/templates/template-defaults";

import { addWorkoutTemplateExerciseAction } from "./actions";

interface AddTemplateExerciseFormProps {
  templateId: string;
  exercises: Exercise[];
}

export function AddTemplateExerciseForm({
  templateId,
  exercises,
}: AddTemplateExerciseFormProps) {
  const [state, formAction, isPending] = useActionState(
    addWorkoutTemplateExerciseAction,
    INITIAL_FORM_ACTION_STATE,
  );
  const hasExercises = exercises.length > 0;

  return (
    <form
      action={formAction}
      className="rounded-md border border-gray-200 bg-white p-4 shadow-sm"
    >
      <input type="hidden" name="templateId" value={templateId} />

      <div>
        <h2 className="text-lg font-semibold text-gray-950">Add exercise</h2>
        <p className="mt-1 text-sm text-gray-600">
          Add an existing active exercise from your library.
        </p>
      </div>

      <div className="mt-4 grid gap-4">
        <ExercisePicker exercises={exercises} />

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <NumberField
            label="Sets"
            name="targetSets"
            defaultValue={DEFAULT_WORKOUT_TEMPLATE_EXERCISE_CONFIG.targetSets}
            min={1}
            step={1}
          />
          <NumberField
            label="Min reps"
            name="minReps"
            defaultValue={DEFAULT_WORKOUT_TEMPLATE_EXERCISE_CONFIG.minReps}
            min={1}
            step={1}
          />
          <NumberField
            label="Max reps"
            name="maxReps"
            defaultValue={DEFAULT_WORKOUT_TEMPLATE_EXERCISE_CONFIG.maxReps}
            min={1}
            step={1}
          />
          <NumberField
            label="Increment lb"
            name="weightIncrementLbs"
            defaultValue={
              DEFAULT_WORKOUT_TEMPLATE_EXERCISE_CONFIG.weightIncrementLbs
            }
            min={0.01}
            step={0.01}
          />
        </div>

        <div className="grid grid-cols-[1fr_96px] gap-3">
          <NumberField
            label="Default weight"
            name="defaultWeightValue"
            defaultValue={
              DEFAULT_WORKOUT_TEMPLATE_EXERCISE_CONFIG.defaultWeightValue
            }
            min={0}
            step={0.01}
          />
          <label className="flex flex-col gap-2 text-sm font-medium text-gray-800">
            Unit
            <select
              name="defaultWeightUnit"
              defaultValue={
                DEFAULT_WORKOUT_TEMPLATE_EXERCISE_CONFIG.defaultWeightUnit
              }
              className="min-h-12 rounded-md border border-gray-300 bg-white px-3 text-base text-gray-950 outline-none transition focus:border-gray-950"
            >
              <option value="lb">lb</option>
              <option value="kg">kg</option>
            </select>
          </label>
        </div>
      </div>

      {state.message ? (
        <p
          className={`mt-4 rounded-md border px-3 py-2 text-sm ${
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
        disabled={isPending || !hasExercises}
        className="mt-4 min-h-12 w-full rounded-md bg-gray-950 px-4 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
      >
        {isPending ? "Adding..." : "Add to template"}
      </button>
    </form>
  );
}

function NumberField({
  label,
  name,
  defaultValue,
  min,
  step,
}: {
  label: string;
  name: string;
  defaultValue: number;
  min: number;
  step: number;
}) {
  return (
    <label className="flex flex-col gap-2 text-sm font-medium text-gray-800">
      {label}
      <input
        name={name}
        type="number"
        required
        min={min}
        step={step}
        defaultValue={defaultValue}
        className="min-h-12 rounded-md border border-gray-300 px-3 text-base text-gray-950 outline-none transition focus:border-gray-950"
      />
    </label>
  );
}
