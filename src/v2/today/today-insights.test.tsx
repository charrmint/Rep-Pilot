import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { WorkoutSession, WorkoutSessionExercise } from "@/features/workouts/types";
import type { PersistedProgressionRecommendation } from "@/features/progression/types";
import type { PersistedStrengthRecord } from "@/features/records/types";
import { getLatestCompletedWorkout } from "@/features/workouts/workout-service";
import { CompletedWorkoutInsights, TodayInsights } from "./today-insights";

const mocks = vi.hoisted(() => ({ refresh: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: mocks.refresh }), unstable_rethrow: vi.fn() }));
vi.mock("@/features/workouts/workout-service", () => ({ getLatestCompletedWorkout: vi.fn() }));
afterEach(cleanup);
beforeEach(() => vi.resetAllMocks());

const recommendation: PersistedProgressionRecommendation = {
  id: "recommendation", action: "increase", reason: "within_rep_range",
  recommendedWeightLbs: 110, recommendedMinReps: 6, recommendedMaxReps: 8,
  recommendedRir: 2, explanation: "Saved explanation from this workout.",
  engineVersion: "double_progression_v1", inputSnapshot: {}, createdAt: "2026-09-25T12:45:00Z",
};
const record: PersistedStrengthRecord = {
  id: "record", userId: "owner", workoutSessionExerciseId: "bench", exerciseId: "bench",
  workoutSessionId: "completed", type: "highest_weight", value: 110, valueUnit: "lb",
  previousRecordId: null, createdAt: "2026-09-25T12:45:00Z", performedAt: "2026-09-25T12:45:00Z",
};
function _exercise(overrides: Partial<WorkoutSessionExercise> = {}): WorkoutSessionExercise {
  return {
    id: "bench", exerciseId: "bench", exerciseName: "Bench press", position: 1,
    targetSets: 3, minReps: 6, maxReps: 8, plannedWeightValue: 50,
    plannedWeightUnit: "kg", plannedNormalizedWeightLbs: 110, weightIncrementLbs: 5,
    previousPerformance: null, recommendation, records: [record],
    sets: [1, 4].map((position) => ({ id: `set-${position}`, position, weightValue: 50,
      weightUnit: "kg", normalizedWeightLbs: 110, reps: 6, rir: null,
      performedAt: "2026-09-25T12:10:00Z" })),
    ...overrides,
  };
}
function _workout(overrides: Partial<WorkoutSession> = {}): WorkoutSession {
  return {
    id: "completed", templateName: "Upper Strength", status: "completed",
    startedAt: "2026-09-25T12:00:00Z", completedAt: "2026-09-25T12:45:00Z",
    exercises: [_exercise(), _exercise({ id: "skipped", exerciseName: "Skipped row", position: 2, sets: [], recommendation: null, records: [] })],
    ...overrides,
  };
}

describe("Today completed workout reads", () => {
  it("reads the signed-in owner's completed result", async () => {
    vi.mocked(getLatestCompletedWorkout).mockResolvedValue(_workout());
    render(await TodayInsights({ userId: "owner" }));
    expect(getLatestCompletedWorkout).toHaveBeenCalledWith("owner");
    expect(screen.getByRole("link", { name: "View workout results" })).toHaveAttribute("href", "/v2/workouts/completed");
  });
  it("explains no completions without suggesting that abandoned history is gone", async () => {
    vi.mocked(getLatestCompletedWorkout).mockResolvedValue(null);
    render(await TodayInsights({ userId: "owner" }));
    expect(screen.getByRole("heading", { name: "No completed workouts yet." })).toBeInTheDocument();
    expect(screen.getByText(/abandoned sessions in History/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "View history" })).toHaveAttribute("href", "/v2/history");
    expect(screen.queryByText("Sets logged")).not.toBeInTheDocument();
  });
  it("offers retry for a failed read rather than displaying an empty history or raw errors", async () => {
    vi.mocked(getLatestCompletedWorkout).mockRejectedValue(new Error("private query detail"));
    render(await TodayInsights({ userId: "owner" }));
    expect(screen.getByRole("alert")).toHaveTextContent("Try again");
    expect(screen.queryByText(/private query detail/)).not.toBeInTheDocument();
    expect(screen.queryByText("No completed workouts yet.")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(mocks.refresh).toHaveBeenCalledOnce();
  });
});

describe("Today persisted insight presentation", () => {
  it("counts exercises with saved sets and all logged positions, including extras and zero-valued sets", () => {
    const exercise = _exercise();
    exercise.sets.push({ ...exercise.sets[0], id: "zero", position: 5, reps: 0, weightValue: 0, normalizedWeightLbs: 0 });
    render(<CompletedWorkoutInsights workout={_workout({ exercises: [exercise, _exercise({ id: "skip", position: 2, sets: [], recommendation: null, records: [] })] })} />);
    const summary = screen.getByText("Last completed workout").closest("section")!;
    expect(within(summary).getByText("Exercises logged").nextElementSibling).toHaveTextContent("1");
    expect(within(summary).getByText("Sets logged").nextElementSibling).toHaveTextContent("3");
    expect(within(summary).getByText("Duration").nextElementSibling).toHaveTextContent("45 min");
    expect(summary.querySelector("time")).toHaveAttribute("datetime", "2026-09-25T12:45:00Z");
  });
  it.each(["lb", "kg"] as const)("uses saved prescriptions and shared record formatting in %s", (unit) => {
    render(<CompletedWorkoutInsights workout={_workout({ exercises: [_exercise({ plannedWeightUnit: unit })] })} />);
    expect(screen.getByText(unit === "kg" ? "Increase to 50 kg" : "Increase to 110 lb")).toBeInTheDocument();
    expect(screen.getByText("3 working sets · 6-8 reps · approximately 2 RIR")).toBeInTheDocument();
    expect(screen.getByText("Saved explanation from this workout.")).toBeInTheDocument();
    const records = screen.getByRole("region", { name: "Strength records" });
    expect(within(records).getByText(unit === "kg" ? "50 kg" : "110 lb")).toBeInTheDocument();
    expect(within(records).getByText("Baseline established")).toBeInTheDocument();
    expect(screen.getByText(/based on that workout’s settings/)).toBeInTheDocument();
  });
  it.each([
    ["maintain", "Stay at 50 kg"],
    ["reduce", "Reduce to 50 kg"],
    ["review", "Review before your next session"],
  ] as const)("preserves a saved %s outcome", (action, heading) => {
    render(<CompletedWorkoutInsights workout={_workout({ exercises: [_exercise({ recommendation: { ...recommendation, action } })] })} />);
    expect(screen.getByText(heading)).toBeInTheDocument();
    expect(screen.queryByText(/Increase to/)).not.toBeInTheDocument();
  });
  it("handles incomplete legacy prescriptions without inventing reps or effort", () => {
    render(<CompletedWorkoutInsights workout={_workout({ exercises: [_exercise({ recommendation: { ...recommendation, recommendedMinReps: null, recommendedMaxReps: null, recommendedRir: null } })] })} />);
    expect(screen.getByText("Increase to 50 kg")).toBeInTheDocument();
    expect(screen.queryByText(/approximately/)).not.toBeInTheDocument();
  });
  it("selects recommendation and records independently by session position without reordering source data", () => {
    const exercises = [
      _exercise({ id: "late", exerciseName: "Later exercise", position: 3 }),
      _exercise({ id: "first", exerciseName: "First recommendation", position: 1, records: [] }),
      _exercise({ id: "second", exerciseName: "First records", position: 2, recommendation: null }),
    ];
    render(<CompletedWorkoutInsights workout={_workout({ exercises })} />);
    expect(screen.getByRole("heading", { name: "First recommendation" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "First records" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Later exercise" })).not.toBeInTheDocument();
    expect(exercises.map((exercise) => exercise.id)).toEqual(["late", "first", "second"]);
  });
  it("keeps the result link and missing-insight copy without fabricating records", () => {
    render(<CompletedWorkoutInsights workout={_workout({ exercises: [_exercise({ recommendation: null, records: [] })] })} />);
    expect(screen.getByRole("heading", { name: "No saved recommendation." })).toBeInTheDocument();
    expect(screen.queryByRole("region", { name: "Strength records" })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "View workout results" })).toHaveAttribute("href", "/v2/workouts/completed");
  });
  it("omits duration and labels the start date when completion time is missing", () => {
    render(<CompletedWorkoutInsights workout={_workout({ completedAt: null, templateName: "Workout", exercises: [] })} />);
    expect(screen.getByRole("heading", { name: "Workout" })).toBeInTheDocument();
    expect(screen.queryByText("Duration")).not.toBeInTheDocument();
    expect(screen.getByText(/Completion time unavailable. Started/)).toBeInTheDocument();
    expect(document.querySelector("time")).toHaveAttribute("datetime", "2026-09-25T12:00:00Z");
  });
  it("keeps linked-record improvements and volume units rather than calling baselines improvements", () => {
    const improvement = { ...record, previousRecordId: "previous", previousRecord: { type: record.type, value: 99, valueUnit: record.valueUnit, exerciseId: "bench", workoutSessionId: "previous-session", performedAt: "2026-09-01T12:00:00Z" } };
    const volume = { ...record, id: "volume", type: "highest_volume" as const, value: 1100, valueUnit: "lb_reps" as const };
    render(<CompletedWorkoutInsights workout={_workout({ exercises: [_exercise({ records: [improvement, volume] })] })} />);
    expect(screen.getByText("+5 kg from 45 kg")).toBeInTheDocument();
    expect(screen.getByText("500 kg·reps")).toBeInTheDocument();
    expect(screen.getByText("Baseline established")).toBeInTheDocument();
  });
});
