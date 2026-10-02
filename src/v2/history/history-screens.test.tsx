import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { getV2Context } from "../server/context";
import { getHistoryRecommendations } from "@/features/workouts/history-recommendations";
import { getExerciseHistory, getTemplateHistory, getWorkoutSession, listExerciseHistorySummaries, listRecentWorkoutHistory, listTemplateHistorySummaries } from "@/features/workouts/workout-service";
import { ExerciseHistoryIndex, ExerciseHistoryScreen, HistoryScreen, PlanHistoryIndex, PlanHistoryScreen, SessionHistoryScreen } from "./history-screens";
import type { WorkoutHistorySession } from "@/features/workouts/types";
vi.mock("../server/context", () => ({ getV2Context: vi.fn() }));
vi.mock("@/features/workouts/history-recommendations", () => ({ getHistoryRecommendations: vi.fn() }));
vi.mock("@/features/workouts/workout-service", () => ({ getExerciseHistory: vi.fn(), getTemplateHistory: vi.fn(), getWorkoutSession: vi.fn(), listExerciseHistorySummaries: vi.fn(), listRecentWorkoutHistory: vi.fn(), listTemplateHistorySummaries: vi.fn() }));
vi.mock("next/navigation", () => ({ notFound: () => { throw new Error("not-found"); }, redirect: (url: string) => { throw new Error(`redirect:${url}`); } }));
const session: WorkoutHistorySession = { id: "saved", templateId: "plan", templateName: "Upper", startedAt: "2026-09-28T12:00:00Z", completedAt: "2026-09-28T13:00:00Z", status: "completed", exercises: [{ sessionExerciseId: "entry", exerciseId: "row", exerciseName: "Saved row name", position: 1, sets: [] }] };
const pagination = { page: 2, hasPreviousPage: true, hasNextPage: true };
beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(getV2Context).mockResolvedValue({ user: { id: "owner" } as NonNullable<Awaited<ReturnType<typeof getV2Context>>["user"]>, activeWorkout: null, activeWorkoutUnavailable: false });
  vi.mocked(getHistoryRecommendations).mockResolvedValue({});
  vi.mocked(listRecentWorkoutHistory).mockResolvedValue({ ...pagination, items: [session] });
  vi.mocked(getTemplateHistory).mockResolvedValue({ template: { id: "plan", name: "Upper", isArchived: true }, workouts: { ...pagination, items: [session] } });
  vi.mocked(getExerciseHistory).mockResolvedValue({ exerciseId: "row", exerciseName: "Row", performances: { ...pagination, items: [{ sessionExerciseId: "entry", workoutSessionId: "saved", templateId: "plan", templateName: "Upper", sessionStatus: "completed", startedAt: session.startedAt, completedAt: session.completedAt, sets: [] }] } });
});
afterEach(cleanup);
it("loads the requested owner's page, groups months, and links only to v2 history", async () => {
  render(await HistoryScreen({ searchParams: Promise.resolve({ page: "2" }) }));
  expect(listRecentWorkoutHistory).toHaveBeenCalledWith({ userId: "owner", page: 2 });
  expect(getHistoryRecommendations).toHaveBeenCalledWith("owner", ["entry"]);
  expect(screen.getByRole("heading", { name: "September 2026" })).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "Next" })).toHaveAttribute("href", "/v2/history?page=3");
  expect(screen.getByRole("link", { name: "Previous" })).toHaveAttribute("href", "/v2/history?page=1");
  fireEvent.click(screen.getByText("View exercises and decisions"));
  expect(screen.getByRole("link", { name: "Saved row name" })).toHaveAttribute("href", "/v2/history/exercises/row");
  expect(screen.getByRole("link", { name: "View session" })).toHaveAttribute("href", "/v2/history/sessions/saved");
});
it("normalizes invalid page input and preserves empty-page recovery", async () => {
  vi.mocked(listRecentWorkoutHistory).mockResolvedValue({ ...pagination, items: [] });
  render(await HistoryScreen({ searchParams: Promise.resolve({ page: "-3" }) }));
  expect(listRecentWorkoutHistory).toHaveBeenCalledWith({ userId: "owner", page: 1 });
  expect(screen.getByRole("heading", { name: "No history to show" })).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "Previous" })).toBeInTheDocument();
});
it("does not read history before authentication", async () => {
  vi.mocked(getV2Context).mockResolvedValue({ user: null, activeWorkout: null, activeWorkoutUnavailable: false });
  render(await HistoryScreen({ searchParams: Promise.resolve({}) }));
  expect(listRecentWorkoutHistory).not.toHaveBeenCalled();
  await expect(PlanHistoryScreen({ templateId: "plan", page: 1 })).rejects.toThrow("redirect:/login");
  await expect(ExerciseHistoryScreen({ exerciseId: "row", page: 1 })).rejects.toThrow("redirect:/login");
  await expect(SessionHistoryScreen({ sessionId: "saved" })).rejects.toThrow("redirect:/login");
});
it("keeps archived plan history and its pagination in v2", async () => {
  render(await PlanHistoryScreen({ templateId: "plan", page: 2 }));
  expect(getTemplateHistory).toHaveBeenCalledWith({ userId: "owner", templateId: "plan", page: 2 });
  expect(screen.getByText("Archived plan")).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "Next" })).toHaveAttribute("href", "/v2/history/plans/plan?page=3");
});
it("shows exercise decisions next to the performance and links back to the saved session", async () => {
  vi.mocked(getHistoryRecommendations).mockResolvedValue({ entry: { id: "decision", action: "review", reason: "pain_recorded", recommendedWeightLbs: null, recommendedMinReps: null, recommendedMaxReps: null, recommendedRir: null, explanation: "Saved explanation", engineVersion: "v1", inputSnapshot: {}, createdAt: session.startedAt } });
  render(await ExerciseHistoryScreen({ exerciseId: "row", page: 2 }));
  expect(getExerciseHistory).toHaveBeenCalledWith({ userId: "owner", exerciseId: "row", page: 2 });
  expect(screen.getByText("Saved explanation")).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "View session" })).toHaveAttribute("href", "/v2/history/sessions/saved");
});
it("does not fetch progression decisions for abandoned sessions", async () => {
  vi.mocked(listRecentWorkoutHistory).mockResolvedValue({ ...pagination, items: [{ ...session, status: "cancelled" }] });
  render(await HistoryScreen({ searchParams: Promise.resolve({}) }));
  expect(getHistoryRecommendations).toHaveBeenCalledWith("owner", []);
  fireEvent.click(screen.getByText("View exercises and decisions"));
  expect(screen.getByText("Abandoned session · no new progression decision.")).toBeInTheDocument();
});
it("returns not-found for inaccessible history subjects", async () => {
  vi.mocked(getTemplateHistory).mockResolvedValue(null);
  vi.mocked(getExerciseHistory).mockResolvedValue(null);
  vi.mocked(getWorkoutSession).mockResolvedValue(null);
  await expect(PlanHistoryScreen({ templateId: "missing", page: 1 })).rejects.toThrow("not-found");
  await expect(ExerciseHistoryScreen({ exerciseId: "missing", page: 1 })).rejects.toThrow("not-found");
  await expect(SessionHistoryScreen({ sessionId: "missing" })).rejects.toThrow("not-found");
});
it("opens saved read-only results and redirects ongoing sessions to logging", async () => {
  vi.mocked(getWorkoutSession).mockResolvedValue({ ...session, exercises: [] });
  render(await SessionHistoryScreen({ sessionId: "saved" }));
  expect(getWorkoutSession).toHaveBeenCalledWith({ userId: "owner", sessionId: "saved" });
  expect(screen.getByText("Read-only")).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "Back to History" })).toHaveAttribute("href", "/v2/history");
  vi.mocked(getWorkoutSession).mockResolvedValue({ ...session, status: "in_progress", exercises: [] });
  await expect(SessionHistoryScreen({ sessionId: "saved" })).rejects.toThrow("redirect:/v2/workouts/saved");
});
it("supports empty subject indexes", async () => {
  vi.mocked(listTemplateHistorySummaries).mockResolvedValue([]);
  vi.mocked(listExerciseHistorySummaries).mockResolvedValue([]);
  render(await PlanHistoryIndex());
  expect(screen.getByRole("heading", { name: "No history to show" })).toBeInTheDocument();
  cleanup();
  render(await ExerciseHistoryIndex());
  expect(screen.getByRole("heading", { name: "No history to show" })).toBeInTheDocument();
});
it("does not disguise service failures as an empty history", async () => {
  vi.mocked(listRecentWorkoutHistory).mockRejectedValue(new Error("offline"));
  await expect(HistoryScreen({ searchParams: Promise.resolve({}) })).rejects.toThrow("offline");
});
