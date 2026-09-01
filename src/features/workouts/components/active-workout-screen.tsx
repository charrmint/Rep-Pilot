"use client";

import Link from "next/link";
import { useState } from "react";

import type { WorkoutSession, WorkoutSet } from "../types";
import { LocalDateTime } from "./local-date-time";
import { WorkoutExerciseCard } from "./workout-exercise-card";
import { WorkoutLifecycleControls } from "./workout-lifecycle-controls";

interface ActiveWorkoutScreenProps {
  initialWorkout: WorkoutSession;
}

export function ActiveWorkoutScreen({
  initialWorkout,
}: ActiveWorkoutScreenProps) {
  const [workout, setWorkout] = useState(initialWorkout);
  const loggedSetCount = workout.exercises.reduce(
    (total, exercise) => total + exercise.sets.length,
    0,
  );
  const plannedSetCount = workout.exercises.reduce(
    (total, exercise) => total + exercise.targetSets,
    0,
  );

  function _handleSetSaved(exerciseId: string, savedSet: WorkoutSet) {
    setWorkout((current) => ({
      ...current,
      exercises: current.exercises.map((exercise) => {
        if (exercise.id !== exerciseId) {
          return exercise;
        }

        const sets = exercise.sets.some((set) => set.id === savedSet.id)
          ? exercise.sets.map((set) =>
              set.id === savedSet.id ? savedSet : set,
            )
          : [...exercise.sets, savedSet];

        return {
          ...exercise,
          sets: sets.sort((left, right) => left.position - right.position),
        };
      }),
    }));
  }

  function _handleSetDeleted(exerciseId: string, deletedSet: WorkoutSet) {
    setWorkout((current) => ({
      ...current,
      exercises: current.exercises.map((exercise) =>
        exercise.id === exerciseId
          ? {
              ...exercise,
              sets: exercise.sets.filter((set) => set.id !== deletedSet.id),
            }
          : exercise,
      ),
    }));
  }

  if (workout.status !== "in_progress") {
    return <ReadOnlyWorkout workout={workout} />;
  }

  return (
    <div className="flex flex-col gap-5">
      <header className="rounded-lg bg-gray-950 p-5 text-white shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-300">
          Active workout
        </p>
        <h1 className="mt-2 text-3xl font-semibold">{workout.templateName}</h1>
        <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm text-gray-300">
          <span>
            Started{" "}
            <LocalDateTime value={workout.startedAt} dateStyle="medium" />
          </span>
          <span>
            {loggedSetCount} logged / {plannedSetCount} planned sets
          </span>
        </div>
      </header>

      <ol className="flex flex-col gap-4">
        {workout.exercises.map((exercise) => (
          <li key={exercise.id}>
            <WorkoutExerciseCard
              exercise={exercise}
              onSetSaved={_handleSetSaved}
              onSetDeleted={_handleSetDeleted}
            />
          </li>
        ))}
      </ol>

      <WorkoutLifecycleControls
        sessionId={workout.id}
        canFinish={loggedSetCount > 0}
      />
      {!loggedSetCount ? (
        <p className="text-center text-sm text-gray-500">
          Log at least one set before finishing.
        </p>
      ) : null}
    </div>
  );
}

function ReadOnlyWorkout({ workout }: { workout: WorkoutSession }) {
  const isCompleted = workout.status === "completed";

  return (
    <div className="flex flex-col gap-5">
      <header
        className={`rounded-lg p-5 shadow-sm ${
          isCompleted ? "bg-green-800 text-white" : "bg-gray-800 text-white"
        }`}
      >
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-200">
          {isCompleted ? "Workout complete" : "Workout abandoned"}
        </p>
        <h1 className="mt-2 text-3xl font-semibold">{workout.templateName}</h1>
        <p className="mt-3 text-sm text-gray-200">
          Started{" "}
          <LocalDateTime value={workout.startedAt} dateStyle="medium" />
          {workout.completedAt ? (
            <>
              {" "}· Finished{" "}
              <LocalDateTime
                value={workout.completedAt}
                dateStyle="medium"
              />
            </>
          ) : null}
        </p>
      </header>

      <ol className="flex flex-col gap-4">
        {workout.exercises.map((exercise) => (
          <li
            key={exercise.id}
            className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm"
          >
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              Exercise {exercise.position}
            </p>
            <h2 className="mt-1 text-xl font-semibold text-gray-950">
              {exercise.exerciseName}
            </h2>
            {exercise.sets.length === 0 ? (
              <p className="mt-3 text-sm text-gray-500">No sets logged.</p>
            ) : (
              <ol className="mt-3 divide-y divide-gray-200 rounded-md border border-gray-200">
                {exercise.sets.map((set) => (
                  <li
                    key={set.id}
                    className="flex items-center justify-between gap-3 px-3 py-3 text-sm"
                  >
                    <span className="font-medium text-gray-600">
                      Set {set.position}
                    </span>
                    <span className="font-semibold text-gray-950">
                      {set.weightValue} {set.weightUnit} × {set.reps}
                    </span>
                  </li>
                ))}
              </ol>
            )}
          </li>
        ))}
      </ol>

      <Link
        href="/templates"
        className="min-h-12 rounded-md bg-gray-950 px-4 py-3 text-center text-sm font-semibold text-white transition hover:bg-gray-800"
      >
        Back to templates
      </Link>
    </div>
  );
}
