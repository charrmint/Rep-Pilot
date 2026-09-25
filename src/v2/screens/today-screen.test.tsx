import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { getV2Context } from "../server/context";
import { loadTodayPlans } from "../today/data";
import { TodayScreen } from "./today-screen";
import { ProfileScreen } from "./profile-screen";

vi.mock("../server/context", () => ({ getV2Context: vi.fn() }));
vi.mock("../today/data", () => ({ loadTodayPlans: vi.fn() }));
vi.mock("../today/active-progress", () => ({ ActiveProgress: () => <p>Saved progress</p> }));
vi.mock("../today/today-plans", () => ({
  NextWorkout: () => <h2>Choose a plan</h2>,
  TodayPlans: () => <p>Plan choices</p>,
  TodayPlansHeading: () => <h2 id="quick-start-heading">Quick start</h2>,
}));
vi.mock("./sign-out-button", () => ({ SignOutButton: () => <button>Sign out</button> }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));
afterEach(cleanup);
beforeEach(() => vi.resetAllMocks());
const user = { id: "owner", email: "owner@example.com" } as NonNullable<Awaited<ReturnType<typeof getV2Context>>["user"]>;

it("keeps signed-out visitors out of personal reads and empty account states", async () => {
  vi.mocked(getV2Context).mockResolvedValue({ user: null, activeWorkout: null, activeWorkoutUnavailable: false });
  render(await TodayScreen());
  expect(screen.getByRole("link", { name: "Sign in" })).toBeInTheDocument();
  expect(loadTodayPlans).not.toHaveBeenCalled();
  expect(screen.queryByRole("heading", { name: "Quick start" })).not.toBeInTheDocument();
});
it("renders resume without waiting for optional plan data", async () => {
  vi.mocked(getV2Context).mockResolvedValue({ user, activeWorkout: { id: "live", templateName: "Current plan", startedAt: "2026-09-24T12:00:00Z" }, activeWorkoutUnavailable: false });
  vi.mocked(loadTodayPlans).mockReturnValue(new Promise(() => {}));
  render(await TodayScreen());
  expect(screen.getByRole("link", { name: "Resume workout" })).toHaveAttribute("href", "/v2/workouts/live");
  expect(screen.queryByRole("heading", { name: "Choose a plan" })).not.toBeInTheDocument();
});
it("shows unknown workout status rather than suggesting a start", async () => {
  vi.mocked(getV2Context).mockResolvedValue({ user, activeWorkout: null, activeWorkoutUnavailable: true });
  vi.mocked(loadTodayPlans).mockReturnValue(Promise.resolve({ status: "unavailable" }));
  render(await TodayScreen());
  expect(screen.getByRole("alert")).toHaveTextContent("couldn’t check whether");
  expect(screen.queryByRole("heading", { name: "Choose a plan" })).not.toBeInTheDocument();
});
it("keeps Profile account controls available during a workout read failure", async () => {
  vi.mocked(getV2Context).mockResolvedValue({ user, activeWorkout: null, activeWorkoutUnavailable: true });
  render(await ProfileScreen());
  expect(screen.getByRole("heading", { name: "owner@example.com" })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Sign out" })).toBeInTheDocument();
});
