import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import type { ExerciseLibrary } from "@/features/exercises/types";
import type { WorkoutTemplateLibrary } from "@/features/templates/types";
import { LibraryBrowser } from "./library-browser";

afterEach(cleanup);

const exercises: ExerciseLibrary = {
  activeExercises: [
    {
      id: "bench",
      name: "Bench press",
      isArchived: false,
      isSystemExercise: true,
    },
    {
      id: "row",
      name: "Cable row",
      isArchived: false,
      isSystemExercise: false,
    },
  ],
  archivedCustomExercises: [
    {
      id: "old-row",
      name: "Old row",
      isArchived: true,
      isSystemExercise: false,
    },
  ],
};

const plans: WorkoutTemplateLibrary = {
  activeTemplates: [
    {
      id: "upper",
      name: "Upper strength",
      isArchived: false,
      createdAt: "2026-09-01",
      updatedAt: "2026-09-01",
      exercises: [],
    },
  ],
  archivedTemplates: [
    {
      id: "old",
      name: "Previous routine",
      isArchived: true,
      createdAt: "2026-09-01",
      updatedAt: "2026-09-01",
      exercises: [],
    },
  ],
};

describe("V2 library", () => {
  it("searches case-insensitively and keeps archived exercises out of active results", () => {
    render(<LibraryBrowser view="exercises" exercises={exercises} />);
    fireEvent.change(screen.getByRole("searchbox"), {
      target: { value: " ROW " },
    });
    expect(
      screen.getByRole("heading", { name: "Cable row" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: "Bench press" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: "Old row" }),
    ).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Archived" }));
    expect(
      screen.getByRole("heading", { name: "Old row" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: "Cable row" }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "View history for Old row" }),
    ).toHaveAttribute("href", "/workouts/exercises/old-row");
  });

  it("recovers from an empty search without changing the archive selection", () => {
    render(<LibraryBrowser view="exercises" exercises={exercises} />);
    fireEvent.click(screen.getByRole("button", { name: "Archived" }));
    fireEvent.change(screen.getByRole("searchbox"), {
      target: { value: "missing" },
    });
    expect(
      screen.getByRole("heading", { name: "No matches found" }),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Clear search" }));
    expect(screen.getByRole("button", { name: "Archived" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(
      screen.getByRole("heading", { name: "Old row" }),
    ).toBeInTheDocument();
  });

  it("links active plans to their existing editor and archived plans to management", () => {
    render(<LibraryBrowser view="plans" plans={plans} />);
    expect(screen.getByRole("link", { name: "Edit plan" })).toHaveAttribute(
      "href",
      "/templates/upper/edit",
    );
    expect(
      screen.queryByRole("heading", { name: "Previous routine" }),
    ).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Archived" }));
    expect(
      screen.queryByRole("link", { name: "Edit plan" }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Manage plan" })).toHaveAttribute(
      "href",
      "/templates",
    );
  });
});
