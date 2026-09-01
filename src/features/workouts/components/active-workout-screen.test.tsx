import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { WorkoutSession, WorkoutSet } from "../types";
import { saveWorkoutSetAction } from "../workout-actions";
import { ActiveWorkoutScreen } from "./active-workout-screen";

vi.mock("../workout-actions", () => ({
  cancelWorkoutAction: vi.fn(),
  deleteWorkoutSetAction: vi.fn(),
  finishWorkoutAction: vi.fn(),
  saveWorkoutSetAction: vi.fn(),
  startWorkoutAction: vi.fn(),
}));

const ACTIVE_WORKOUT: WorkoutSession = {
  id: "session-id",
  templateName: "Upper A",
  status: "in_progress",
  startedAt: "2026-09-01T16:00:00.000Z",
  completedAt: null,
  exercises: [
    {
      id: "session-exercise-id",
      exerciseId: "exercise-id",
      exerciseName: "Bench Press",
      position: 1,
      targetSets: 3,
      minReps: 8,
      maxReps: 12,
      plannedWeightValue: 135,
      plannedWeightUnit: "lb",
      plannedNormalizedWeightLbs: 135,
      weightIncrementLbs: 5,
      sets: [],
    },
  ],
};

describe("ActiveWorkoutScreen", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders planned set rows for an active workout", () => {
    render(<ActiveWorkoutScreen initialWorkout={ACTIVE_WORKOUT} />);

    expect(screen.getByRole("heading", { name: "Upper A" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Bench Press" })).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: "Log set" })).toHaveLength(3);
    expect(screen.getByText("0 logged / 3 planned sets")).toBeInTheDocument();
  });

  it("updates logged progress after saving a set", async () => {
    const savedSet: WorkoutSet = {
      id: "set-id",
      position: 1,
      reps: 10,
      weightValue: 135,
      weightUnit: "lb",
      normalizedWeightLbs: 135,
      performedAt: "2026-09-01T16:05:00.000Z",
    };

    vi.mocked(saveWorkoutSetAction).mockResolvedValue(savedSet);
    render(<ActiveWorkoutScreen initialWorkout={ACTIVE_WORKOUT} />);

    fireEvent.change(screen.getAllByLabelText("Reps")[0], {
      target: { value: "10" },
    });
    fireEvent.click(screen.getAllByRole("button", { name: "Log set" })[0]);

    await waitFor(() => {
      expect(screen.getByText("1 logged / 3 planned sets")).toBeInTheDocument();
    });
    expect(saveWorkoutSetAction).toHaveBeenCalledWith({
      sessionExerciseId: "session-exercise-id",
      workoutSetId: undefined,
      position: 1,
      reps: 10,
      weightValue: 135,
      weightUnit: "lb",
    });
  });

  it("renders completed workouts as read-only", () => {
    render(
      <ActiveWorkoutScreen
        initialWorkout={{
          ...ACTIVE_WORKOUT,
          status: "completed",
          completedAt: "2026-09-01T17:00:00.000Z",
        }}
      />,
    );

    expect(screen.getByText("Workout complete")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Log set" })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Back to templates" })).toBeInTheDocument();
  });
});
