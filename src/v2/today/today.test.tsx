import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { WorkoutTemplateDetails, WorkoutTemplateLibrary } from "@/features/templates/types";
import type { WorkoutSession, WorkoutSessionExercise } from "@/features/workouts/types";
import { listWorkoutTemplateLibrary } from "@/features/templates/template-service";
import { getWorkoutSession } from "@/features/workouts/workout-service";
import { startV2Workout } from "../workouts/actions";
import { ActiveProgress } from "./active-progress";
import { loadTodayPlans } from "./data";
import { selectQuickStartPlans } from "./plans";
import { NextWorkout, TodayPlans } from "./today-plans";

const mocks = vi.hoisted(() => ({ refresh: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: mocks.refresh }), unstable_rethrow: vi.fn() }));
vi.mock("@/features/templates/template-service", () => ({ listWorkoutTemplateLibrary: vi.fn() }));
vi.mock("@/features/workouts/workout-service", () => ({ getWorkoutSession: vi.fn() }));
vi.mock("../workouts/actions", () => ({ startV2Workout: vi.fn() }));
afterEach(cleanup);
beforeEach(() => vi.resetAllMocks());

function _plan(id: string, updatedAt = "2026-09-24T12:00:00Z"): WorkoutTemplateDetails {
  return {
    id, name: `Plan ${id}`, updatedAt, createdAt: updatedAt, isArchived: false,
    exercises: [{
      id: `${id}-bench`, templateId: id, exerciseId: "bench", exerciseName: "Bench press",
      exerciseIsArchived: false, exerciseIsSystemExercise: true, position: 1,
      config: { targetSets: 3, minReps: 6, maxReps: 8, defaultWeightValue: 100, defaultWeightUnit: "lb", defaultNormalizedWeightLbs: 100, weightIncrementLbs: 5 },
    }],
  };
}
function _library(activeTemplates: WorkoutTemplateDetails[] = [], archivedTemplates: WorkoutTemplateDetails[] = []): WorkoutTemplateLibrary {
  return { activeTemplates, archivedTemplates };
}
function _plans(library: WorkoutTemplateLibrary) {
  return Promise.resolve({ status: "ready" as const, library });
}
const activeWorkout = { id: "live", templateName: "Current plan", startedAt: "2026-09-24T12:00:00Z" };

describe("Today plan selection and reads", () => {
  it("selects at most two usable active plans by update time then ID without mutating the library", () => {
    const library = _library([
      _plan("older", "2026-09-20T12:00:00Z"), _plan("b"), _plan("a"),
      { ..._plan("empty", "2026-09-25T12:00:00Z"), exercises: [] },
      { ..._plan("archived", "2026-09-25T12:00:00Z"), isArchived: true },
    ], [_plan("not-active")]);
    const original = library.activeTemplates.map((plan) => plan.id);
    expect(selectQuickStartPlans(library).map((plan) => plan.id)).toEqual(["a", "b"]);
    expect(library.activeTemplates.map((plan) => plan.id)).toEqual(original);
  });
  it.each([0, 1, 2])("keeps %i available plans without sample entries", (count) => {
    expect(selectQuickStartPlans(_library(Array.from({ length: count }, (_, i) => _plan(String(i)))))).toHaveLength(count);
  });
  it("loads through the existing account-scoped service", async () => {
    const library = _library([_plan("a")]);
    vi.mocked(listWorkoutTemplateLibrary).mockResolvedValue(library);
    expect(await loadTodayPlans("owner")).toEqual({ status: "ready", library });
    expect(listWorkoutTemplateLibrary).toHaveBeenCalledWith("owner");
  });
  it("distinguishes failed reads from empty plans", async () => {
    vi.mocked(listWorkoutTemplateLibrary).mockRejectedValue(new Error("private database detail"));
    expect(await loadTodayPlans("owner")).toEqual({ status: "unavailable" });
  });
});

describe("Today next action", () => {
  it("sends a new account to classic plan creation", async () => {
    render(await NextWorkout({ plans: _plans(_library()) }));
    expect(screen.getByRole("link", { name: "Create a plan" })).toHaveAttribute("href", "/templates");
    expect(screen.queryByRole("link", { name: "Choose a workout" })).not.toBeInTheDocument();
    expect(screen.getByText(/creation and editing open in the classic app/)).toBeInTheDocument();
  });
  it("offers setup for active plans without exercises", async () => {
    render(await NextWorkout({ plans: _plans(_library([{ ..._plan("a"), exercises: [] }])) }));
    expect(screen.getByRole("link", { name: "Set up a plan" })).toHaveAttribute("href", "/v2/library");
  });
  it("distinguishes archived-only accounts and retains library access", async () => {
    render(await NextWorkout({ plans: _plans(_library([], [{ ..._plan("a"), isArchived: true }])) }));
    expect(screen.getByRole("heading", { name: "Bring a plan back into your routine." })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Open library" })).toHaveAttribute("href", "/v2/library");
  });
  it("offers choice when a plan can start", async () => {
    render(await NextWorkout({ plans: _plans(_library([_plan("a")])) }));
    expect(screen.getByRole("link", { name: "Choose a workout" })).toHaveAttribute("href", "/v2/library");
  });
});

describe("Today quick start", () => {
  it("shows exact prescription counts and starts the selected plan through the shared action", async () => {
    render(await TodayPlans({ plans: _plans(_library([_plan("a"), _plan("b")])), activeWorkout: null, activeWorkoutUnavailable: false }));
    const card = screen.getByRole("article", { name: "Plan b" });
    expect(within(card).getByText("1 exercise · 3 planned sets")).toBeInTheDocument();
    fireEvent.click(within(card).getByRole("button", { name: "Start workout" }));
    expect(startV2Workout).toHaveBeenCalledWith({ templateId: "b", activeSessionIdToCancel: undefined });
  });
  it("retains cancel/resume and explicit replacement confirmation", async () => {
    render(await TodayPlans({ plans: _plans(_library([_plan("a")])), activeWorkout, activeWorkoutUnavailable: false }));
    fireEvent.click(screen.getByRole("button", { name: "Start workout" }));
    expect(startV2Workout).not.toHaveBeenCalled();
    expect(screen.getByRole("link", { name: "Resume current" })).toHaveAttribute("href", "/v2/workouts/live");
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(startV2Workout).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Start workout" }));
    fireEvent.click(screen.getByRole("button", { name: "Abandon and start" }));
    expect(startV2Workout).toHaveBeenCalledWith({ templateId: "a", activeSessionIdToCancel: "live" });
  });
  it("blocks starting when workout status is unknown", async () => {
    render(await TodayPlans({ plans: _plans(_library([_plan("a")])), activeWorkout: null, activeWorkoutUnavailable: true }));
    const button = screen.getByRole("button", { name: "Workout status unavailable" });
    expect(button).toBeDisabled();
    fireEvent.click(button);
    expect(startV2Workout).not.toHaveBeenCalled();
  });
  it("offers a fresh read after a plan failure without claiming the account is empty", async () => {
    render(await TodayPlans({ plans: Promise.resolve({ status: "unavailable" }), activeWorkout, activeWorkoutUnavailable: false }));
    expect(screen.getByRole("alert")).toHaveTextContent("couldn’t load your plans");
    expect(screen.queryByText("No plans yet.")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(mocks.refresh).toHaveBeenCalledOnce();
  });
  it.each(["empty", "incomplete", "archived"])("never offers a start for %s plans", async (state) => {
    const library = state === "empty" ? _library() : state === "incomplete" ? _library([{ ..._plan("a"), exercises: [] }]) : _library([], [_plan("a")]);
    render(await TodayPlans({ plans: _plans(library), activeWorkout, activeWorkoutUnavailable: false }));
    expect(screen.queryByRole("button", { name: "Start workout" })).not.toBeInTheDocument();
    expect(screen.getByRole("link")).toHaveAttribute("href", state === "empty" ? "/templates" : "/v2/library");
  });
});

function _exercise(positions: number[], targetSets = 3): WorkoutSessionExercise {
  return {
    id: "exercise", exerciseId: "bench", exerciseName: "Bench press", position: 1, targetSets,
    minReps: 6, maxReps: 8, plannedWeightValue: 100, plannedWeightUnit: "lb",
    plannedNormalizedWeightLbs: 100, weightIncrementLbs: 5, previousPerformance: null, recommendation: null, records: [],
    sets: positions.map((position) => ({ id: `set-${position}`, position, weightValue: 100, weightUnit: "lb", normalizedWeightLbs: 100, reps: 6, rir: null, performedAt: "2026-09-24T12:10:00Z" })),
  };
}
function _workout(exercises: WorkoutSessionExercise[]): WorkoutSession {
  return { id: "live", templateName: "Upper", startedAt: activeWorkout.startedAt, completedAt: null, status: "in_progress", exercises };
}
describe("Today persisted progress", () => {
  it("uses ownership-scoped saved positions, excluding extras and deleted gaps", async () => {
    vi.mocked(getWorkoutSession).mockResolvedValue(_workout([_exercise([1, 3, 4]), { ..._exercise([1]), id: "other", position: 2 }]));
    render(await ActiveProgress({ userId: "owner", sessionId: "live" }));
    expect(getWorkoutSession).toHaveBeenCalledWith({ userId: "owner", sessionId: "live" });
    expect(screen.getByText("3 of 6 planned sets logged")).toBeInTheDocument();
    expect(screen.getByRole("progressbar")).toHaveAttribute("value", "3");
    expect(screen.getByRole("progressbar")).toHaveAttribute("max", "6");
  });
  it("does not divide by zero for an empty session", async () => {
    vi.mocked(getWorkoutSession).mockResolvedValue(_workout([]));
    render(await ActiveProgress({ userId: "owner", sessionId: "live" }));
    expect(screen.getByText("0 of 0 planned sets logged")).toBeInTheDocument();
    expect(screen.queryByRole("progressbar")).not.toBeInTheDocument();
  });
  it("does not replace a failed progress read with zero", async () => {
    vi.mocked(getWorkoutSession).mockRejectedValue(new Error("timeout"));
    render(await ActiveProgress({ userId: "owner", sessionId: "live" }));
    expect(screen.getByRole("alert")).toHaveTextContent("You can still resume");
    expect(screen.queryByRole("progressbar")).not.toBeInTheDocument();
  });
  it.each(["completed", "cancelled", "missing"])("handles a concurrently %s session", async (status) => {
    vi.mocked(getWorkoutSession).mockResolvedValue(status === "missing" ? null : { ..._workout([]), status: status as "completed" | "cancelled" });
    render(await ActiveProgress({ userId: "owner", sessionId: "live" }));
    expect(screen.getByRole("status")).toHaveTextContent("workout has changed");
    expect(screen.queryByRole("progressbar")).not.toBeInTheDocument();
  });
});
