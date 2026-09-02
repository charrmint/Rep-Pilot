import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
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
      previousPerformance: null,
      recommendation: null,
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
      rir: 2,
      performedAt: "2026-09-01T16:05:00.000Z",
    };

    vi.mocked(saveWorkoutSetAction).mockResolvedValue(savedSet);
    render(<ActiveWorkoutScreen initialWorkout={ACTIVE_WORKOUT} />);

    fireEvent.change(screen.getAllByLabelText("Reps")[0], {
      target: { value: "10" },
    });
    const rirPicker = screen.getByRole("listbox", { name: "RIR for set 1" });
    Object.defineProperty(rirPicker, "scrollTop", {
      configurable: true,
      value: 64,
    });
    fireEvent.scroll(rirPicker);
    fireEvent.click(screen.getAllByRole("button", { name: "Log set" })[0]);

    await waitFor(() => {
      expect(screen.getByText("1 logged / 3 planned sets")).toBeInTheDocument();
    });
    expect(within(rirPicker).getByRole("option", { name: "2" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    expect(saveWorkoutSetAction).toHaveBeenCalledWith({
      sessionExerciseId: "session-exercise-id",
      workoutSetId: undefined,
      position: 1,
      reps: 10,
      weightValue: 135,
      weightUnit: "lb",
      rir: 2,
    });
  });

  it("shows the most recent completed sets for an exercise", () => {
    render(
      <ActiveWorkoutScreen
        initialWorkout={{
          ...ACTIVE_WORKOUT,
          exercises: [
            {
              ...ACTIVE_WORKOUT.exercises[0],
              previousPerformance: {
                workoutSessionId: "previous-session-id",
                workoutSessionExerciseId: "previous-session-exercise-id",
                startedAt: "2026-08-28T16:00:00.000Z",
                sets: [
                  {
                    id: "previous-set-1",
                    position: 1,
                    reps: 10,
                    weightValue: 130,
                    weightUnit: "lb",
                    normalizedWeightLbs: 130,
                    rir: null,
                    performedAt: "2026-08-28T16:05:00.000Z",
                  },
                  {
                    id: "previous-set-2",
                    position: 2,
                    reps: 9,
                    weightValue: 130,
                    weightUnit: "lb",
                    normalizedWeightLbs: 130,
                    rir: null,
                    performedAt: "2026-08-28T16:08:00.000Z",
                  },
                ],
              },
            },
          ],
        }}
      />,
    );

    const previousPerformance = screen.getByRole("region", {
      name: "Previous performance for Bench Press",
    });

    expect(within(previousPerformance).getByText("130 lb × 10")).toBeInTheDocument();
    expect(within(previousPerformance).getByText("130 lb × 9")).toBeInTheDocument();
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

  it("shows the persisted progression recommendation on a completed exercise", () => {
    render(
      <ActiveWorkoutScreen
        initialWorkout={{
          ...ACTIVE_WORKOUT,
          status: "completed",
          completedAt: "2026-09-01T17:00:00.000Z",
          exercises: [
            {
              ...ACTIVE_WORKOUT.exercises[0],
              plannedWeightUnit: "kg",
              recommendation: {
                id: "recommendation-id",
                action: "increase",
                reason: "top_of_rep_range",
                recommendedWeightLbs: 143,
                recommendedMinReps: 8,
                recommendedMaxReps: 10,
                recommendedRir: 2,
                explanation:
                  "You completed all 3 working sets at the top of your 8-12 rep range.",
                engineVersion: "double_progression_v1",
                inputSnapshot: {},
                createdAt: "2026-09-01T17:00:00.000Z",
              },
            },
          ],
        }}
      />,
    );

    const recommendation = screen.getByRole("region", {
      name: "Progression recommendation",
    });

    expect(within(recommendation).getByText("Increase to 65 kg")).toBeInTheDocument();
    expect(
      within(recommendation).getByText(
        "3 working sets · 8-10 reps · approximately 2 RIR",
      ),
    ).toBeInTheDocument();
    expect(
      within(recommendation).getByText(/completed all 3 working sets/),
    ).toBeInTheDocument();
  });

  it("does not render undefined values from an incomplete legacy prescription", () => {
    render(
      <ActiveWorkoutScreen
        initialWorkout={{
          ...ACTIVE_WORKOUT,
          status: "completed",
          completedAt: "2026-09-01T17:00:00.000Z",
          exercises: [
            {
              ...ACTIVE_WORKOUT.exercises[0],
              recommendation: {
                id: "legacy-recommendation-id",
                action: "maintain",
                reason: "default_maintain",
                recommendedWeightLbs: 100,
                explanation:
                  "Build consistency at this weight before changing it.",
                engineVersion: "double_progression_v1",
                inputSnapshot: {},
                createdAt: "2026-09-01T17:00:00.000Z",
              } as NonNullable<
                WorkoutSession["exercises"][number]["recommendation"]
              >,
            },
          ],
        }}
      />,
    );

    const recommendation = screen.getByRole("region", {
      name: "Progression recommendation",
    });

    expect(within(recommendation).queryByText(/undefined/)).not.toBeInTheDocument();
    expect(within(recommendation).queryByText(/working sets/)).not.toBeInTheDocument();
  });
});
