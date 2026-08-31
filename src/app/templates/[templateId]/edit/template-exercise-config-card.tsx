"use client";

import { useActionState } from "react";

import { INITIAL_FORM_ACTION_STATE } from "@/app/_shared/form-action-state";
import type { WorkoutTemplateExercise } from "@/features/templates/types";

import {
  moveWorkoutTemplateExerciseAction,
  removeWorkoutTemplateExerciseAction,
  updateWorkoutTemplateExerciseAction,
} from "./actions";

interface TemplateExerciseConfigCardProps {
  exercise: WorkoutTemplateExercise;
  isFirst: boolean;
  isLast: boolean;
}

export function TemplateExerciseConfigCard({
  exercise,
  isFirst,
  isLast,
}: TemplateExerciseConfigCardProps) {
  const [updateState, updateAction, isUpdating] = useActionState(
    updateWorkoutTemplateExerciseAction,
    INITIAL_FORM_ACTION_STATE,
  );
  const [moveState, moveAction, isMoving] = useActionState(
    moveWorkoutTemplateExerciseAction,
    INITIAL_FORM_ACTION_STATE,
  );
  const [removeState, removeAction, isRemoving] = useActionState(
    removeWorkoutTemplateExerciseAction,
    INITIAL_FORM_ACTION_STATE,
  );

  return (
    <li className="rounded-md border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="text-sm font-medium uppercase tracking-wide text-gray-500">
            Exercise {exercise.position}
          </p>
          <h3 className="mt-1 truncate text-lg font-semibold text-gray-950">
            {exercise.exerciseName}
          </h3>
          <div className="mt-2 flex flex-wrap gap-2">
            {exercise.exerciseIsSystemExercise ? (
              <span className="rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-600">
                System
              </span>
            ) : (
              <span className="rounded-full bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700">
                Custom
              </span>
            )}
            {exercise.exerciseIsArchived ? (
              <span className="rounded-full bg-amber-50 px-2 py-1 text-xs font-medium text-amber-700">
                Archived exercise
              </span>
            ) : null}
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <form action={moveAction}>
            <TemplateExerciseIdentityFields exercise={exercise} />
            <button
              type="submit"
              name="direction"
              value="move_up"
              disabled={isMoving || isFirst}
              className="min-h-10 rounded-md border border-gray-300 px-3 text-sm font-semibold text-gray-700 transition hover:border-gray-400 hover:text-gray-950 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Up
            </button>
          </form>
          <form action={moveAction}>
            <TemplateExerciseIdentityFields exercise={exercise} />
            <button
              type="submit"
              name="direction"
              value="move_down"
              disabled={isMoving || isLast}
              className="min-h-10 rounded-md border border-gray-300 px-3 text-sm font-semibold text-gray-700 transition hover:border-gray-400 hover:text-gray-950 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Down
            </button>
          </form>
          <form action={removeAction}>
            <TemplateExerciseIdentityFields exercise={exercise} />
            <button
              type="submit"
              disabled={isRemoving}
              className="min-h-10 rounded-md border border-red-200 px-3 text-sm font-semibold text-red-700 transition hover:border-red-300 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isRemoving ? "Removing..." : "Remove"}
            </button>
          </form>
        </div>
      </div>

      {moveState.status === "error" && moveState.message ? (
        <p className="mt-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {moveState.message}
        </p>
      ) : null}
      {removeState.status === "error" && removeState.message ? (
        <p className="mt-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {removeState.message}
        </p>
      ) : null}

      <form action={updateAction} className="mt-4 grid gap-4">
        <TemplateExerciseIdentityFields exercise={exercise} />

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <NumberField
            label="Sets"
            name="targetSets"
            defaultValue={exercise.config.targetSets}
            min={1}
            step={1}
          />
          <NumberField
            label="Min reps"
            name="minReps"
            defaultValue={exercise.config.minReps}
            min={1}
            step={1}
          />
          <NumberField
            label="Max reps"
            name="maxReps"
            defaultValue={exercise.config.maxReps}
            min={1}
            step={1}
          />
          <NumberField
            label="Increment lb"
            name="weightIncrementLbs"
            defaultValue={exercise.config.weightIncrementLbs}
            min={0.01}
            step={0.01}
          />
        </div>

        <div className="grid grid-cols-[1fr_96px] gap-3">
          <NumberField
            label="Default weight"
            name="defaultWeightValue"
            defaultValue={exercise.config.defaultWeightValue}
            min={0}
            step={0.01}
          />
          <label className="flex flex-col gap-2 text-sm font-medium text-gray-800">
            Unit
            <select
              name="defaultWeightUnit"
              defaultValue={exercise.config.defaultWeightUnit}
              className="min-h-12 rounded-md border border-gray-300 bg-white px-3 text-base text-gray-950 outline-none transition focus:border-gray-950"
            >
              <option value="lb">lb</option>
              <option value="kg">kg</option>
            </select>
          </label>
        </div>

        {updateState.message ? (
          <p
            className={`rounded-md border px-3 py-2 text-sm ${
              updateState.status === "error"
                ? "border-red-200 bg-red-50 text-red-700"
                : "border-green-200 bg-green-50 text-green-700"
            }`}
          >
            {updateState.message}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={isUpdating}
          className="min-h-12 rounded-md bg-gray-950 px-4 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60 sm:w-fit"
        >
          {isUpdating ? "Saving..." : "Save exercise"}
        </button>
      </form>
    </li>
  );
}

function TemplateExerciseIdentityFields({
  exercise,
}: {
  exercise: WorkoutTemplateExercise;
}) {
  return (
    <>
      <input type="hidden" name="templateId" value={exercise.templateId} />
      <input
        type="hidden"
        name="templateExerciseId"
        value={exercise.id}
      />
    </>
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
