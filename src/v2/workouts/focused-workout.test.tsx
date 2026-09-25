import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type {
  WorkoutSession,
  WorkoutSessionExercise,
  WorkoutSet,
} from "@/features/workouts/types";
import {
  saveWorkoutSetAction,
  deleteWorkoutSetAction,
} from "@/features/workouts/workout-actions";
import { reloadV2Workout } from "./actions";
import { FocusedWorkout } from "./focused-workout";

vi.mock("@/features/workouts/workout-actions", () => ({
  saveWorkoutSetAction: vi.fn(),
  deleteWorkoutSetAction: vi.fn(),
}));
vi.mock("./actions", () => ({ reloadV2Workout: vi.fn() }));
vi.mock("next/navigation", () => ({ unstable_rethrow: vi.fn() }));

const exercise: WorkoutSessionExercise = {
  id: "session-bench",
  exerciseId: "bench",
  exerciseName: "Bench Press",
  position: 1,
  targetSets: 2,
  minReps: 8,
  maxReps: 10,
  plannedWeightValue: 100,
  plannedWeightUnit: "lb",
  plannedNormalizedWeightLbs: 100,
  weightIncrementLbs: 5,
  previousPerformance: null,
  recommendation: null,
  records: [],
  sets: [],
};
const workout: WorkoutSession = {
  id: "workout",
  templateName: "Upper",
  status: "in_progress",
  startedAt: "2026-09-24T12:00:00Z",
  completedAt: null,
  exercises: [
    exercise,
    {
      ...exercise,
      id: "session-row",
      exerciseId: "row",
      exerciseName: "Cable Row",
      position: 2,
    },
  ],
};
const savedSet: WorkoutSet = {
  id: "set-1",
  position: 1,
  reps: 8,
  weightValue: 100,
  weightUnit: "lb",
  normalizedWeightLbs: 100,
  rir: null,
  performedAt: "2026-09-24T12:01:00Z",
};

function _render(
  sets: WorkoutSet[] = [],
  overrides: Partial<WorkoutSessionExercise> = {},
) {
  const data = {
    ...workout,
    exercises: [{ ...exercise, sets, ...overrides }, workout.exercises[1]],
  };
  render(<FocusedWorkout initialWorkout={data} />);
  return data;
}
function _reps(value: string) {
  fireEvent.change(screen.getByRole("spinbutton", { name: "Reps" }), {
    target: { value },
  });
}
function _switch(name: string) {
  fireEvent.click(
    within(
      screen.getByRole("navigation", { name: "Workout exercises" }),
    ).getByRole("button", { name: new RegExp(name) }),
  );
}

beforeEach(() => vi.resetAllMocks());
afterEach(cleanup);

describe("Focused workout", () => {
  it("defaults to Skip and clears a selected effort without submitting the set", () => {
    _render();
    expect(
      screen.getByRole("button", { name: "Skip", exact: true }),
    ).toHaveAttribute("aria-pressed", "true");
    fireEvent.click(screen.getByRole("button", { name: "0", exact: true }));
    expect(
      screen.getByRole("button", { name: "0", exact: true }),
    ).toHaveAttribute("aria-pressed", "true");
    expect(
      screen.getByRole("button", { name: "Skip", exact: true }),
    ).toHaveAttribute("aria-pressed", "false");
    fireEvent.click(screen.getByRole("button", { name: "Skip", exact: true }));
    expect(
      screen.getByRole("button", { name: "Skip", exact: true }),
    ).toHaveAttribute("aria-pressed", "true");
    expect(saveWorkoutSetAction).not.toHaveBeenCalled();
  });

  it("preserves an existing higher RIR when only reps are edited", async () => {
    _render([{ ...savedSet, rir: 7 }]);
    fireEvent.click(screen.getByRole("button", { name: "Edit set 1" }));
    expect(
      screen.getByRole("button", { name: "3+", exact: true }),
    ).toHaveAttribute("aria-pressed", "true");
    _reps("9");
    vi.mocked(saveWorkoutSetAction).mockResolvedValue({
      ...savedSet,
      reps: 9,
      rir: 7,
    });
    fireEvent.click(screen.getByRole("button", { name: "Update set" }));
    await waitFor(() =>
      expect(saveWorkoutSetAction).toHaveBeenCalledWith(
        expect.objectContaining({ rir: 7, reps: 9 }),
      ),
    );
  });
  it("stays on a completed exercise and allows extra sets", async () => {
    const data = _render([savedSet, { ...savedSet, id: "set-2", position: 2 }]);
    _switch("Bench Press");
    expect(
      screen.getByRole("heading", { name: "Planned sets logged." }),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Add another set" }));
    _reps("6");
    vi.mocked(saveWorkoutSetAction).mockResolvedValue({
      ...savedSet,
      id: "extra",
      position: 3,
      reps: 6,
    });
    fireEvent.click(screen.getByRole("button", { name: "Log set" }));
    await waitFor(() =>
      expect(
        screen.getByRole("heading", { name: "Planned sets logged." }),
      ).toBeInTheDocument(),
    );
    expect(
      screen.getByRole("heading", { name: data.exercises[0].exerciseName }),
    ).toBeInTheDocument();
    expect(screen.getByText("2 of 4 planned sets")).toBeInTheDocument();
    expect(screen.getByText(/3 total logged/)).toBeInTheDocument();
  });

  it("applies a suggestion only to draft weight while keeping reps and RIR", () => {
    _render([], {
      previousPerformance: {
        workoutSessionId: "previous",
        workoutSessionExerciseId: "previous-exercise",
        startedAt: "2026-09-23T12:00:00Z",
        targetSets: 2,
        sets: [savedSet],
        recommendation: {
          id: "recommendation",
          action: "reduce",
          reason: "repeated_underperformance",
          recommendedWeightLbs: 95,
          recommendedMinReps: 8,
          recommendedMaxReps: 10,
          recommendedRir: 2,
          explanation: "Build consistency.",
          engineVersion: "test",
          inputSnapshot: {},
          createdAt: "2026-09-23T13:00:00Z",
        },
      },
    });
    _reps("9");
    fireEvent.click(screen.getByRole("button", { name: "3+", exact: true }));
    fireEvent.click(
      screen.getByRole("button", { name: "Use suggested weight" }),
    );
    expect(screen.getByRole("spinbutton", { name: "Weight (lb)" })).toHaveValue(
      95,
    );
    expect(screen.getByRole("spinbutton", { name: "Reps" })).toHaveValue(9);
    expect(
      screen.getByRole("button", { name: "3+", exact: true }),
    ).toHaveAttribute("aria-pressed", "true");
    expect(saveWorkoutSetAction).not.toHaveBeenCalled();
  });

  it("warns before leaving via an app link with unlogged changes", () => {
    const confirm = vi.spyOn(window, "confirm").mockReturnValue(false);
    _render();
    _reps("8");
    const event = new MouseEvent("click", { bubbles: true, cancelable: true });
    screen.getByRole("link", { name: "Finish / abandon" }).dispatchEvent(event);
    expect(confirm).toHaveBeenCalled();
    expect(event.defaultPrevented).toBe(true);
    confirm.mockRestore();
  });
  it("keeps per-exercise drafts when switching exercises", () => {
    _render();
    _reps("9");
    fireEvent.click(screen.getByRole("button", { name: "3+", exact: true }));
    _switch("Cable Row");
    _reps("7");
    _switch("Bench Press");
    expect(screen.getByRole("spinbutton", { name: "Reps" })).toHaveValue(9);
    expect(
      screen.getByRole("button", { name: "3+", exact: true }),
    ).toHaveAttribute("aria-pressed", "true");
    expect(saveWorkoutSetAction).not.toHaveBeenCalled();
  });

  it("keeps a new-set draft while editing a saved set", async () => {
    _render([savedSet]);
    _reps("9");
    fireEvent.click(screen.getByRole("button", { name: "Edit set 1" }));
    _reps("10");
    vi.mocked(saveWorkoutSetAction).mockResolvedValue({
      ...savedSet,
      reps: 10,
    });
    fireEvent.click(screen.getByRole("button", { name: "Update set" }));
    await waitFor(() =>
      expect(
        screen.getByRole("heading", { name: "Log set 2" }),
      ).toBeInTheDocument(),
    );
    expect(screen.getByRole("spinbutton", { name: "Reps" })).toHaveValue(9);
    expect(saveWorkoutSetAction).toHaveBeenCalledWith(
      expect.objectContaining({ workoutSetId: savedSet.id, reps: 10 }),
    );
  });

  it("waits for confirmed saves and blocks repeated submission", async () => {
    let resolve!: (set: WorkoutSet) => void;
    vi.mocked(saveWorkoutSetAction).mockReturnValue(
      new Promise((done) => {
        resolve = done;
      }),
    );
    _render();
    _reps("8");
    const button = screen.getByRole("button", { name: "Log set" });
    fireEvent.click(button);
    fireEvent.click(button);
    expect(saveWorkoutSetAction).toHaveBeenCalledTimes(1);
    expect(screen.getByText("0 of 4 planned sets")).toBeInTheDocument();
    await act(async () => resolve(savedSet));
    expect(screen.getByText("1 of 4 planned sets")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Log set 2" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("spinbutton", { name: "Reps" })).toHaveValue(null);
  });

  it("preserves input and blocks retries until server state can be checked", async () => {
    const data = _render();
    _reps("9");
    vi.mocked(saveWorkoutSetAction).mockRejectedValue(new Error("timeout"));
    vi.mocked(reloadV2Workout).mockRejectedValueOnce(new Error("offline"));
    fireEvent.click(screen.getByRole("button", { name: "Log set" }));
    await screen.findByRole("button", { name: "Check saved sets" });
    expect(screen.getByRole("spinbutton", { name: "Reps" })).toHaveValue(9);
    expect(screen.getByRole("button", { name: "Please wait…" })).toBeDisabled();
    vi.mocked(reloadV2Workout).mockResolvedValue({
      ...data,
      exercises: [{ ...exercise, sets: [savedSet] }, data.exercises[1]],
    });
    fireEvent.click(screen.getByRole("button", { name: "Check saved sets" }));
    await screen.findByRole("button", { name: "Update set" });
    vi.mocked(saveWorkoutSetAction).mockResolvedValue({ ...savedSet, reps: 9 });
    fireEvent.click(screen.getByRole("button", { name: "Update set" }));
    await waitFor(() =>
      expect(saveWorkoutSetAction).toHaveBeenLastCalledWith(
        expect.objectContaining({ workoutSetId: savedSet.id, reps: 9 }),
      ),
    );
  });

  it("does not count extra sets toward missing planned positions", () => {
    _render([savedSet, { ...savedSet, id: "extra", position: 3 }]);
    expect(screen.getByText("1 of 4 planned sets")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Log set 2" }),
    ).toBeInTheDocument();
  });

  it("fills a deleted planned position without renumbering later sets", async () => {
    _render([savedSet]);
    _reps("9");
    vi.mocked(deleteWorkoutSetAction).mockResolvedValue();
    fireEvent.click(screen.getByRole("button", { name: "Delete set 1" }));
    expect(deleteWorkoutSetAction).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Confirm delete" }));
    await waitFor(() =>
      expect(screen.getByText("0 of 4 planned sets")).toBeInTheDocument(),
    );
    // The current set-2 editor is preserved; resuming after reload will fill set 1.
    expect(
      screen.getByRole("heading", { name: "Log set 2" }),
    ).toBeInTheDocument();
  });

  it("uses converted configured increments and stores the 3+ selection as 3", async () => {
    _render([], {
      plannedWeightValue: 50,
      plannedWeightUnit: "kg",
      weightIncrementLbs: 5.5,
    });
    fireEvent.click(
      screen.getByRole("button", { name: "Increase weight by 2.5 kg" }),
    );
    expect(screen.getByRole("spinbutton", { name: "Weight (kg)" })).toHaveValue(
      52.5,
    );
    _reps("8");
    fireEvent.click(screen.getByRole("button", { name: "3+", exact: true }));
    vi.mocked(saveWorkoutSetAction).mockResolvedValue({
      ...savedSet,
      weightValue: 52.5,
      weightUnit: "kg",
      rir: 3,
    });
    fireEvent.click(screen.getByRole("button", { name: "Log set" }));
    await waitFor(() =>
      expect(saveWorkoutSetAction).toHaveBeenCalledWith(
        expect.objectContaining({
          weightValue: 52.5,
          weightUnit: "kg",
          rir: 3,
        }),
      ),
    );
  });

  it("renders closed workouts without mutation controls", () => {
    render(
      <FocusedWorkout initialWorkout={{ ...workout, status: "completed" }} />,
    );
    expect(
      screen.getByRole("heading", { name: "Workout complete" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Log set" }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "View workout results" }),
    ).toHaveAttribute("href", "/workouts/workout");
  });
});
