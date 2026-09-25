import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, it } from "vitest";
import type { WorkoutSession } from "@/features/workouts/types";
import { WorkoutResults } from "./workout-results";

afterEach(cleanup);
const workout: WorkoutSession = {
  id: "session",
  templateName: "Upper",
  status: "completed",
  startedAt: "2026-09-24T12:00:00Z",
  completedAt: "2026-09-24T13:00:00Z",
  exercises: [
    {
      id: "session-bench",
      exerciseId: "bench",
      exerciseName: "Bench Press",
      position: 1,
      targetSets: 3,
      minReps: 8,
      maxReps: 10,
      plannedWeightValue: 50,
      plannedWeightUnit: "kg",
      plannedNormalizedWeightLbs: 110,
      weightIncrementLbs: 5,
      previousPerformance: null,
      sets: [
        {
          id: "set",
          position: 1,
          weightValue: 50,
          weightUnit: "kg",
          normalizedWeightLbs: 110,
          reps: 8,
          rir: 3,
          performedAt: "2026-09-24T12:02:00Z",
        },
      ],
      records: [
        {
          id: "record",
          userId: "user",
          exerciseId: "bench",
          workoutSessionId: "session",
          workoutSessionExerciseId: "session-bench",
          type: "highest_weight",
          value: 110,
          valueUnit: "lb",
          previousRecordId: null,
          createdAt: "2026-09-24T13:00:00Z",
          performedAt: "2026-09-24T13:00:00Z",
        },
      ],
      recommendation: {
        id: "rec",
        action: "maintain",
        reason: "within_rep_range",
        recommendedWeightLbs: 110,
        recommendedMinReps: 8,
        recommendedMaxReps: 10,
        recommendedRir: 2,
        explanation: "Build consistency at this weight.",
        engineVersion: "double_progression_v1",
        inputSnapshot: {},
        createdAt: "2026-09-24T13:00:00Z",
      },
    },
  ],
};
it("shows persisted sets, duration, records and recommendations in the exercise unit", () => {
  render(<WorkoutResults workout={workout} />);
  expect(screen.getByText("1 hr")).toBeInTheDocument();
  expect(screen.getByText("50 kg × 8 · 3+ RIR")).toBeInTheDocument();
  expect(screen.getByText("Baseline established")).toBeInTheDocument();
  expect(screen.getByText("Stay at 50 kg")).toBeInTheDocument();
  expect(
    screen.getByText("Build consistency at this weight."),
  ).toBeInTheDocument();
  expect(screen.queryByRole("button")).not.toBeInTheDocument();
});
it("does not show recommendations, records, or an invented duration on abandoned workouts", () => {
  render(
    <WorkoutResults
      workout={{ ...workout, status: "cancelled", completedAt: null }}
    />,
  );
  expect(screen.getByText("50 kg × 8 · 3+ RIR")).toBeInTheDocument();
  expect(
    screen.queryByRole("region", { name: "Strength records" }),
  ).not.toBeInTheDocument();
  expect(
    screen.queryByRole("region", { name: "Progression recommendation" }),
  ).not.toBeInTheDocument();
  expect(screen.queryByText("Duration")).not.toBeInTheDocument();
});
it("renders skipped exercises and incomplete legacy recommendations safely", () => {
  render(
    <WorkoutResults
      workout={{
        ...workout,
        exercises: [
          {
            ...workout.exercises[0],
            sets: [],
            records: [],
            recommendation: {
              ...workout.exercises[0].recommendation!,
              recommendedMinReps: null,
            },
          },
        ],
      }}
    />,
  );
  expect(screen.getByText("No sets logged.")).toBeInTheDocument();
  expect(screen.getByText("Stay at 50 kg")).toBeInTheDocument();
  expect(screen.queryByText(/working sets ·/)).not.toBeInTheDocument();
});
