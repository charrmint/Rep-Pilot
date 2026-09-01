"use client";

import { useState } from "react";

import type {
  Exercise,
  ExerciseLibrary as ExerciseLibraryData,
} from "@/features/exercises/types";
import type { WorkoutTemplateDetails } from "@/features/templates/types";

import { ExerciseList } from "./exercise-list";

interface ExerciseLibraryProps {
  library: ExerciseLibraryData;
  activeTemplates: WorkoutTemplateDetails[];
}

export function ExerciseLibrary({
  library,
  activeTemplates,
}: ExerciseLibraryProps) {
  const [query, setQuery] = useState("");
  const activeExercises = _filterExercises(library.activeExercises, query);
  const archivedCustomExercises = _filterExercises(
    library.archivedCustomExercises,
    query,
  );
  const hasQuery = query.trim().length > 0;

  return (
    <>
      <section className="rounded-md border border-gray-200 bg-white p-4 shadow-sm">
        <label
          htmlFor="exercise-library-search"
          className="text-sm font-medium text-gray-800"
        >
          Search exercise library
        </label>
        <div className="mt-2 flex gap-2">
          <input
            id="exercise-library-search"
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by exercise name"
            className="min-h-12 min-w-0 flex-1 rounded-md border border-gray-300 px-3 text-base text-gray-950 outline-none transition placeholder:text-gray-400 focus:border-gray-950"
          />
          {hasQuery ? (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="min-h-12 rounded-md border border-gray-300 px-3 text-sm font-semibold text-gray-700 transition hover:border-gray-500 hover:text-gray-950"
            >
              Clear
            </button>
          ) : null}
        </div>
      </section>

      <ExerciseList
        title="Active library"
        description="Search, review history, or add an exercise directly to an active template."
        emptyMessage={
          hasQuery
            ? `No active exercises match “${query.trim()}”.`
            : "No active exercises found."
        }
        exercises={activeExercises}
        activeTemplates={activeTemplates}
        allowTemplateAssignment
      />

      <ExerciseList
        title="Archived custom exercises"
        description="Archived exercises stay out of new templates but can be restored."
        emptyMessage={
          hasQuery
            ? `No archived exercises match “${query.trim()}”.`
            : "No archived custom exercises."
        }
        exercises={archivedCustomExercises}
        activeTemplates={[]}
      />
    </>
  );
}

function _filterExercises(exercises: Exercise[], query: string): Exercise[] {
  const normalizedQuery = query.trim().toLowerCase();

  if (normalizedQuery.length === 0) {
    return exercises;
  }

  return exercises.filter((exercise) =>
    exercise.name.toLowerCase().includes(normalizedQuery),
  );
}
