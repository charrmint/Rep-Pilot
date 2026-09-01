"use client";

import { useId, useState } from "react";

import type { Exercise } from "@/features/exercises/types";

interface ExercisePickerProps {
  exercises: Exercise[];
}

export function ExercisePicker({ exercises }: ExercisePickerProps) {
  const pickerId = useId();
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedExerciseId, setSelectedExerciseId] = useState(
    exercises[0]?.id ?? "",
  );
  const selectedExercise =
    exercises.find((exercise) => exercise.id === selectedExerciseId) ??
    exercises[0] ??
    null;
  const normalizedQuery = query.trim().toLowerCase();
  const filteredExercises = exercises.filter((exercise) =>
    exercise.name.toLowerCase().includes(normalizedQuery),
  );

  function _selectExercise(exercise: Exercise): void {
    setSelectedExerciseId(exercise.id);
    setQuery("");
    setIsOpen(false);
  }

  function _togglePicker(): void {
    setQuery("");
    setIsOpen((currentIsOpen) => !currentIsOpen);
  }

  return (
    <div className="flex flex-col gap-2">
      <span
        id={`${pickerId}-label`}
        className="text-sm font-medium text-gray-800"
      >
        Exercise
      </span>
      <input
        type="hidden"
        name="exerciseId"
        value={selectedExercise?.id ?? ""}
      />

      <button
        type="button"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-labelledby={`${pickerId}-label ${pickerId}-selection`}
        aria-controls={`${pickerId}-options`}
        disabled={exercises.length === 0}
        onClick={_togglePicker}
        className="flex min-h-12 w-full items-center justify-between gap-3 rounded-md border border-gray-300 bg-white px-3 text-left text-base text-gray-950 outline-none transition hover:border-gray-500 focus:border-gray-950 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-500"
      >
        <span id={`${pickerId}-selection`} className="min-w-0 truncate">
          {selectedExercise?.name ?? "No active exercises available"}
        </span>
        <span aria-hidden="true" className="shrink-0 text-gray-500">
          {isOpen ? "▲" : "▼"}
        </span>
      </button>

      {isOpen ? (
        <div className="w-full rounded-md border border-gray-300 bg-white p-2 shadow-sm">
          <label htmlFor={`${pickerId}-search`} className="sr-only">
            Search exercises
          </label>
          <input
            id={`${pickerId}-search`}
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search exercises"
            autoFocus
            className="min-h-11 w-full rounded-md border border-gray-300 px-3 text-base text-gray-950 outline-none transition placeholder:text-gray-400 focus:border-gray-950"
          />

          <div
            id={`${pickerId}-options`}
            role="listbox"
            aria-labelledby={`${pickerId}-label`}
            className="mt-2 max-h-64 w-full overflow-y-auto overscroll-contain"
          >
            {filteredExercises.length === 0 ? (
              <p className="px-3 py-4 text-sm text-gray-600">
                No exercises match “{query.trim()}”.
              </p>
            ) : (
              filteredExercises.map((exercise) => {
                const isSelected = exercise.id === selectedExercise?.id;

                return (
                  <button
                    key={exercise.id}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => _selectExercise(exercise)}
                    className={`flex min-h-12 w-full items-center justify-between gap-3 rounded-md px-3 py-2 text-left text-base transition ${
                      isSelected
                        ? "bg-gray-950 font-semibold text-white"
                        : "text-gray-800 hover:bg-gray-100"
                    }`}
                  >
                    <span>{exercise.name}</span>
                    {isSelected ? <span aria-hidden="true">✓</span> : null}
                  </button>
                );
              })
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
