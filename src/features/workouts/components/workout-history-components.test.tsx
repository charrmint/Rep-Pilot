import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import type {
  ExerciseHistoryPerformance,
  WorkoutHistorySession,
  WorkoutSet,
} from "../types";
import { ExercisePerformanceList } from "./exercise-performance-list";
import { WorkoutPerformanceCard } from "./workout-performance-card";

const SETS: WorkoutSet[] = [
  {
    id: "set-1",
    position: 1,
    reps: 10,
    weightValue: 135,
    weightUnit: "lb",
    normalizedWeightLbs: 135,
    rir: null,
    performedAt: "2026-09-01T16:05:00.000Z",
  },
  {
    id: "set-2",
    position: 2,
    reps: 9,
    weightValue: 135,
    weightUnit: "lb",
    normalizedWeightLbs: 135,
    rir: null,
    performedAt: "2026-09-01T16:08:00.000Z",
  },
];

describe("workout history components", () => {
  it("shows weight and reps for every exercise set in template history", () => {
    const workout: WorkoutHistorySession = {
      id: "session-id",
      templateId: "template-id",
      templateName: "Push Day",
      status: "completed",
      startedAt: "2026-09-01T16:00:00.000Z",
      completedAt: "2026-09-01T17:00:00.000Z",
      exercises: [
        {
          sessionExerciseId: "session-exercise-id",
          exerciseId: "bench-press-id",
          exerciseName: "Bench Press",
          position: 1,
          sets: SETS,
        },
      ],
    };

    render(<WorkoutPerformanceCard workout={workout} />);

    expect(screen.getByText("Bench Press")).toBeInTheDocument();
    expect(screen.getByText("135 lb × 10")).toBeInTheDocument();
    expect(screen.getByText("135 lb × 9")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Exercise history" })).toHaveAttribute(
      "href",
      "/workouts/exercises/bench-press-id",
    );
    expect(
      screen.getByRole("link", { name: "View complete workout →" }),
    ).toHaveAttribute("href", "/workouts/session-id");
  });

  it("groups one exercise performance under its source template and workout", () => {
    const performance: ExerciseHistoryPerformance = {
      sessionExerciseId: "session-exercise-id",
      workoutSessionId: "session-id",
      templateId: "template-id",
      templateName: "Push Day",
      sessionStatus: "completed",
      startedAt: "2026-09-01T16:00:00.000Z",
      completedAt: "2026-09-01T17:00:00.000Z",
      sets: SETS,
    };

    render(<ExercisePerformanceList performances={[performance]} />);

    const templateLink = screen.getByRole("link", { name: "Push Day" });
    const performanceCard = templateLink.closest("article");

    expect(templateLink).toHaveAttribute(
      "href",
      "/workouts/templates/template-id",
    );
    expect(performanceCard).not.toBeNull();
    expect(within(performanceCard!).getByText("135 lb × 10")).toBeInTheDocument();
  });
});
