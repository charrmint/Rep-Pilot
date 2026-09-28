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
import { reloadV2Workout, endV2Workout } from "./actions";
import { FocusedWorkout } from "./focused-workout";

vi.mock("@/features/workouts/workout-actions", () => ({
  saveWorkoutSetAction: vi.fn(),
  deleteWorkoutSetAction: vi.fn(),
}));
vi.mock("./actions", () => ({
  reloadV2Workout: vi.fn(),
  endV2Workout: vi.fn(),
}));
const refresh = vi.hoisted(() => vi.fn());
vi.mock("next/navigation", () => ({
  unstable_rethrow: vi.fn(),
  useRouter: () => ({ refresh }),
}));

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

beforeEach(() => {
  vi.resetAllMocks();
  HTMLDialogElement.prototype.showModal = function () {
    this.open = true;
  };
  HTMLDialogElement.prototype.close = function () {
    this.open = false;
  };
});
afterEach(cleanup);

describe("Focused workout", () => {
  it("requires acknowledgement before discarding drafts and finishing a partial session", async () => {
    const data = _render([savedSet]);
    _reps("9");
    _switch("Cable Row");
    fireEvent.click(screen.getByRole("button", { name: "Finish workout" }));
    const dialog = screen.getByRole("dialog", { name: "Finish this workout?" });
    expect(
      within(dialog).getByText(/3 planned sets are still unlogged/),
    ).toBeInTheDocument();
    const confirm = within(dialog).getByRole("button", {
      name: "Confirm finish",
    });
    expect(confirm).toBeDisabled();
    fireEvent.click(within(dialog).getByRole("checkbox"));
    vi.mocked(endV2Workout).mockResolvedValue({
      ...data,
      status: "completed",
      completedAt: "2026-09-24T13:00:00Z",
    });
    fireEvent.click(confirm);
    await screen.findByRole("heading", { name: "Workout complete" });
    expect(endV2Workout).toHaveBeenCalledWith("workout", "finish");
    expect(saveWorkoutSetAction).not.toHaveBeenCalled();
    expect(screen.getByText("100 lb × 8")).toBeInTheDocument();
    expect(screen.queryByRole("spinbutton")).not.toBeInTheDocument();
    expect(refresh).toHaveBeenCalled();
  });

  it("keeps drafts when the user cancels completion", () => {
    _render([savedSet]);
    _reps("9");
    fireEvent.click(screen.getByRole("button", { name: "Finish workout" }));
    fireEvent.click(screen.getByRole("button", { name: "Keep working out" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.getByRole("spinbutton", { name: "Reps" })).toHaveValue(9);
    expect(endV2Workout).not.toHaveBeenCalled();
  });

  it("explains why zero-weight sets cannot finish but allows abandonment", async () => {
    const data = _render([
      { ...savedSet, weightValue: 0, normalizedWeightLbs: 0 },
    ]);
    fireEvent.click(screen.getByRole("button", { name: "Finish workout" }));
    expect(
      screen.getByRole("button", { name: "Confirm finish" }),
    ).toBeDisabled();
    expect(
      screen.getByText(/Log at least one set with positive weight/),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Keep working out" }));
    fireEvent.click(screen.getByLabelText("Workout options"));
    fireEvent.click(screen.getByRole("button", { name: "Abandon workout" }));
    vi.mocked(endV2Workout).mockResolvedValue({ ...data, status: "cancelled" });
    fireEvent.click(screen.getByRole("button", { name: "Confirm abandon" }));
    await screen.findByRole("heading", { name: "Workout abandoned" });
    expect(endV2Workout).toHaveBeenCalledWith("workout", "abandon");
    expect(screen.getByText("0 lb × 8")).toBeInTheDocument();
    expect(screen.queryByText("Duration")).not.toBeInTheDocument();
  });

  it("blocks ending while a save is pending", async () => {
    let resolve!: (set: WorkoutSet) => void;
    vi.mocked(saveWorkoutSetAction).mockReturnValue(
      new Promise((done) => {
        resolve = done;
      }),
    );
    _render();
    _reps("8");
    fireEvent.click(screen.getByRole("button", { name: "Log set" }));
    expect(
      screen.getByRole("button", { name: "Finish workout" }),
    ).toBeDisabled();
    fireEvent.click(screen.getByLabelText("Workout options"));
    expect(screen.getByRole("button", { name: "Abandon workout" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Increase reps by 1" })).toBeDisabled();
    await act(async () => resolve(savedSet));
    expect(endV2Workout).not.toHaveBeenCalled();
  });

  it("blocks duplicate finishes and closing the dialog during completion", async () => {
    const data = _render([savedSet]);
    let resolve!: (value: WorkoutSession) => void;
    vi.mocked(endV2Workout).mockReturnValue(
      new Promise((done) => {
        resolve = done;
      }),
    );
    fireEvent.click(screen.getByRole("button", { name: "Finish workout" }));
    const confirm = screen.getByRole("button", { name: "Confirm finish" });
    fireEvent.click(confirm);
    fireEvent.click(confirm);
    expect(endV2Workout).toHaveBeenCalledTimes(1);
    expect(
      screen.getByRole("button", { name: "Keep working out" }),
    ).toBeDisabled();
    fireEvent(
      screen.getByRole("dialog"),
      new Event("cancel", { cancelable: true }),
    );
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    await act(async () =>
      resolve({
        ...data,
        status: "completed",
        completedAt: "2026-09-24T13:00:00Z",
      }),
    );
  });

  it("recovers a completed session after an ambiguous failure without finishing twice", async () => {
    const data = _render([savedSet]);
    vi.mocked(endV2Workout).mockRejectedValue(new Error("response lost"));
    vi.mocked(reloadV2Workout)
      .mockRejectedValueOnce(new Error("offline"))
      .mockResolvedValueOnce({
        ...data,
        status: "completed",
        completedAt: "2026-09-24T13:00:00Z",
      });
    fireEvent.click(screen.getByRole("button", { name: "Finish workout" }));
    fireEvent.click(screen.getByRole("button", { name: "Confirm finish" }));
    await screen.findByRole("button", { name: "Check workout status" });
    expect(
      screen.getByRole("button", { name: "Confirm finish" }),
    ).toBeDisabled();
    fireEvent.click(
      screen.getByRole("button", { name: "Check workout status" }),
    );
    await screen.findByRole("heading", { name: "Workout complete" });
    expect(endV2Workout).toHaveBeenCalledTimes(1);
  });

  it("keeps unsaved edits when finishing fails and the workout is still active", async () => {
    const data = _render([savedSet]);
    _reps("9");
    vi.mocked(endV2Workout).mockRejectedValue(new Error("failed"));
    vi.mocked(reloadV2Workout).mockResolvedValue(data);
    fireEvent.click(screen.getByRole("button", { name: "Finish workout" }));
    fireEvent.click(screen.getByRole("checkbox"));
    fireEvent.click(screen.getByRole("button", { name: "Confirm finish" }));
    await waitFor(() =>
      expect(
        within(screen.getByRole("dialog")).getByRole("alert"),
      ).toHaveTextContent("Your input is kept"),
    );
    fireEvent.click(screen.getByRole("button", { name: "Keep working out" }));
    expect(screen.getByRole("spinbutton", { name: "Reps" })).toHaveValue(9);
    expect(refresh).not.toHaveBeenCalled();
  });
  it("defaults to Skip and clears a selected effort without submitting the set", () => {
    _render();
    expect(screen.getByRole("button", { name: "Skip" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    fireEvent.click(screen.getByRole("button", { name: "0" }));
    expect(screen.getByRole("button", { name: "0" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByRole("button", { name: "Skip" })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
    fireEvent.click(screen.getByRole("button", { name: "Skip" }));
    expect(screen.getByRole("button", { name: "Skip" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(saveWorkoutSetAction).not.toHaveBeenCalled();
  });

  it("preserves an existing higher RIR when only reps are edited", async () => {
    _render([{ ...savedSet, rir: 7 }]);
    fireEvent.click(screen.getByRole("button", { name: "Edit set 1" }));
    expect(screen.getByRole("button", { name: "3+" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
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
    fireEvent.click(screen.getByRole("button", { name: "3+" }));
    fireEvent.click(
      screen.getByRole("button", { name: "Use suggested weight" }),
    );
    expect(screen.getByRole("spinbutton", { name: "Weight (lb)" })).toHaveValue(
      95,
    );
    expect(screen.getByRole("spinbutton", { name: "Reps" })).toHaveValue(9);
    expect(screen.getByRole("button", { name: "3+" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(saveWorkoutSetAction).not.toHaveBeenCalled();
  });

  it("warns before leaving via an app link with unlogged changes", () => {
    const confirm = vi.spyOn(window, "confirm").mockReturnValue(false);
    _render();
    _reps("8");
    const event = new MouseEvent("click", { bubbles: true, cancelable: true });
    screen.getByRole("link", { name: "← Today" }).dispatchEvent(event);
    expect(confirm).toHaveBeenCalled();
    expect(event.defaultPrevented).toBe(true);
    confirm.mockRestore();
  });
  it("keeps per-exercise drafts when switching exercises", () => {
    _render();
    _reps("9");
    fireEvent.click(screen.getByRole("button", { name: "3+" }));
    _switch("Cable Row");
    _reps("7");
    _switch("Bench Press");
    expect(screen.getByRole("spinbutton", { name: "Reps" })).toHaveValue(9);
    expect(screen.getByRole("button", { name: "3+" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
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
    fireEvent.click(screen.getByRole("button", { name: "Edit set 1" }));
    fireEvent.click(screen.getByRole("button", { name: "Delete set 1" }));
    expect(deleteWorkoutSetAction).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Confirm delete" }));
    await waitFor(() =>
      expect(screen.getByText("0 of 4 planned sets")).toBeInTheDocument(),
    );
    // Deletion returns to the missing planned position; the set-2 draft survives.
    expect(
      screen.getByRole("heading", { name: "Log set 1" }),
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
    fireEvent.click(screen.getByRole("button", { name: "3+" }));
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
    expect(screen.getByRole("link", { name: "Back to Today" })).toHaveAttribute(
      "href",
      "/v2",
    );
  });
});

it("steps reps without submitting, clamps at zero, and keeps direct typing", () => {
  _render();
  fireEvent.click(screen.getByRole("button", { name: "Increase reps by 1" }));
  expect(screen.getByRole("spinbutton", { name: "Reps" })).toHaveValue(1);
  fireEvent.click(screen.getByRole("button", { name: "Decrease reps by 1" }));
  fireEvent.click(screen.getByRole("button", { name: "Decrease reps by 1" }));
  expect(screen.getByRole("spinbutton", { name: "Reps" })).toHaveValue(0);
  _reps("12");
  fireEvent.click(screen.getByRole("button", { name: "Increase reps by 1" }));
  expect(screen.getByRole("spinbutton", { name: "Reps" })).toHaveValue(13);
  expect(saveWorkoutSetAction).not.toHaveBeenCalled();
});

it("previews the next prescription and preserves drafts when using Next", () => {
  _render();
  expect(screen.getByText("2 sets · 8–10 reps · 100 lb")).toBeInTheDocument();
  _reps("11");
  fireEvent.click(screen.getByRole("button", { name: "Go to Cable Row" }));
  expect(screen.getByRole("heading", { name: "Cable Row", level: 1 })).toBeInTheDocument();
  expect(screen.queryByText("Up next")).not.toBeInTheDocument();
  _switch("Bench Press");
  expect(screen.getByRole("spinbutton", { name: "Reps" })).toHaveValue(11);
});

it("shows saved units and RIR in columns and only offers deletion when editing", () => {
  _render([{ ...savedSet, rir: 7, weightValue: 45, weightUnit: "kg" }]);
  const table = screen.getByRole("table");
  expect(within(table).getByRole("cell", { name: "45 kg" })).toBeInTheDocument();
  expect(within(table).getByRole("cell", { name: "7" })).toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "Delete set 1" })).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Edit set 1" }));
  fireEvent.click(screen.getByRole("button", { name: "Delete set 1" }));
  expect(screen.getByRole("button", { name: "Keep set" })).toHaveFocus();
  fireEvent.click(screen.getByRole("button", { name: "Keep set" }));
  expect(screen.getByRole("button", { name: "Delete set 1" })).toHaveFocus();
  expect(deleteWorkoutSetAction).not.toHaveBeenCalled();
});

it("keeps mixed previous units in the expanded context instead of combining loads", () => {
  _render([], { previousPerformance: {
    workoutSessionId: "previous", workoutSessionExerciseId: "previous-exercise",
    startedAt: "2026-09-23T12:00:00Z", targetSets: 2, recommendation: null,
    sets: [savedSet, { ...savedSet, id: "kg", position: 2, weightValue: 45, weightUnit: "kg", rir: 2 }],
  } });
  expect(screen.getByText("2 saved sets · varied weights or units")).toBeInTheDocument();
  fireEvent.click(screen.getByText("View previous sets (2)"));
  expect(screen.getByText("Set 1: 100 lb × 8")).toBeVisible();
  expect(screen.getByText("Set 2: 45 kg × 8 · 2 RIR")).toBeVisible();
});

it("summarizes equal previous loads with reps in saved position order", () => {
  _render([], { previousPerformance: {
    workoutSessionId: "previous", workoutSessionExerciseId: "previous-exercise",
    startedAt: "2026-09-23T12:00:00Z", targetSets: 2, recommendation: null,
    sets: [{ ...savedSet, id: "second", position: 2, reps: 7 }, savedSet],
  } });
  expect(screen.getByText("100 lb · 8, 7 reps")).toBeInTheDocument();
});

it("closes workout options with Escape and restores trigger focus", () => {
  _render();
  const trigger = screen.getByLabelText("Workout options");
  fireEvent.click(trigger);
  const details = trigger.closest("details")!;
  expect(details.open).toBe(true);
  fireEvent.keyDown(screen.getByRole("button", { name: "Abandon workout" }), { key: "Escape" });
  expect(details.open).toBe(false);
  expect(trigger).toHaveFocus();
});

it("returns focus to workout options after cancelling abandonment", async () => {
  _render();
  const trigger = screen.getByLabelText("Workout options");
  fireEvent.click(trigger);
  fireEvent.click(screen.getByRole("button", { name: "Abandon workout" }));
  fireEvent.click(screen.getByRole("button", { name: "Keep working out" }));
  await waitFor(() => expect(trigger).toHaveFocus());
});
