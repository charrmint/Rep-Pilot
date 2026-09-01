import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import type { ExerciseLibrary as ExerciseLibraryData } from "@/features/exercises/types";
import type { WorkoutTemplateDetails } from "@/features/templates/types";

import { ExerciseLibrary } from "./exercise-library";

const LIBRARY: ExerciseLibraryData = {
  activeExercises: [
    {
      id: "bench-press-id",
      name: "Bench Press",
      isArchived: false,
      isSystemExercise: true,
    },
    {
      id: "barbell-squat-id",
      name: "Barbell Squat",
      isArchived: false,
      isSystemExercise: true,
    },
  ],
  archivedCustomExercises: [],
};

const PUSH_TEMPLATE: WorkoutTemplateDetails = {
  id: "push-template-id",
  name: "Push Day",
  isArchived: false,
  createdAt: "2026-09-01T10:00:00.000Z",
  updatedAt: "2026-09-01T10:00:00.000Z",
  exercises: [
    {
      id: "template-bench-id",
      templateId: "push-template-id",
      exerciseId: "bench-press-id",
      exerciseName: "Bench Press",
      exerciseIsArchived: false,
      exerciseIsSystemExercise: true,
      position: 1,
      config: {
        targetSets: 3,
        minReps: 8,
        maxReps: 12,
        defaultWeightValue: 135,
        defaultWeightUnit: "lb",
        defaultNormalizedWeightLbs: 135,
        weightIncrementLbs: 5,
      },
    },
  ],
};

describe("ExerciseLibrary", () => {
  it("filters active exercises by name", () => {
    render(
      <ExerciseLibrary library={LIBRARY} activeTemplates={[PUSH_TEMPLATE]} />,
    );

    fireEvent.change(
      screen.getByRole("searchbox", { name: "Search exercise library" }),
      { target: { value: "squat" } },
    );

    expect(screen.queryByText("Bench Press")).not.toBeInTheDocument();
    expect(screen.getByText("Barbell Squat")).toBeInTheDocument();
  });

  it("offers template assignment only when the exercise is not already added", () => {
    render(
      <ExerciseLibrary library={LIBRARY} activeTemplates={[PUSH_TEMPLATE]} />,
    );

    expect(screen.getByText("Added to all")).toBeInTheDocument();
    expect(
      screen.getByText("Add to template", { selector: "summary" }),
    ).toBeInTheDocument();
  });
});
