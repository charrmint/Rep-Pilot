import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import type { Exercise } from "@/features/exercises/types";

import { ExercisePicker } from "./exercise-picker";

const EXERCISES: Exercise[] = [
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
  {
    id: "romanian-deadlift-id",
    name: "Romanian Deadlift",
    isArchived: false,
    isSystemExercise: true,
  },
];

describe("ExercisePicker", () => {
  it("filters the scrollable options and stores the selected exercise", () => {
    const { container } = render(<ExercisePicker exercises={EXERCISES} />);

    fireEvent.click(screen.getByRole("button", { name: /Bench Press/ }));
    fireEvent.change(screen.getByRole("searchbox", { name: "Search exercises" }), {
      target: { value: "squat" },
    });

    expect(
      screen.queryByRole("option", { name: "Bench Press" }),
    ).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("option", { name: "Barbell Squat" }));

    expect(screen.getByRole("button", { name: /Barbell Squat/ })).toHaveAttribute(
      "aria-expanded",
      "false",
    );
    expect(
      container.querySelector('input[name="exerciseId"]'),
    ).toHaveValue("barbell-squat-id");
  });

  it("explains when no exercises match the search", () => {
    render(<ExercisePicker exercises={EXERCISES} />);

    fireEvent.click(screen.getByRole("button", { name: /Bench Press/ }));
    fireEvent.change(screen.getByRole("searchbox", { name: "Search exercises" }), {
      target: { value: "curl" },
    });

    expect(screen.getByText("No exercises match “curl”.")).toBeInTheDocument();
  });
});
