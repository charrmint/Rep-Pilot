import { beforeEach, describe, expect, it, vi } from "vitest";
import { getCurrentUser } from "@/features/auth/auth-server-service";
import {
  cancelWorkout,
  finishWorkout,
  getWorkoutSession,
} from "@/features/workouts/workout-service";
import { revalidatePath } from "next/cache";
import { endV2Workout, reloadV2Workout } from "./actions";
import type { WorkoutSession } from "@/features/workouts/types";

vi.mock("@/features/auth/auth-server-service", () => ({
  getCurrentUser: vi.fn(),
}));
vi.mock("@/features/workouts/workout-service", () => ({
  cancelWorkout: vi.fn(),
  finishWorkout: vi.fn(),
  getWorkoutSession: vi.fn(),
  startWorkout: vi.fn(),
}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("next/navigation", () => ({
  redirect: vi.fn((url: string) => {
    throw new Error(`redirect:${url}`);
  }),
}));
const completed: WorkoutSession = {
  id: "session",
  templateName: "Upper",
  status: "completed",
  startedAt: "2026-09-24T12:00:00Z",
  completedAt: "2026-09-24T13:00:00Z",
  exercises: [],
};
beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(getCurrentUser).mockResolvedValue({ id: "user" } as NonNullable<
    Awaited<ReturnType<typeof getCurrentUser>>
  >);
  vi.mocked(getWorkoutSession).mockResolvedValue(completed);
});

describe("V2 workout completion actions", () => {
  it("calls the shared finish service as the signed-in user and returns persisted results", async () => {
    expect(await endV2Workout("session", "finish")).toBe(completed);
    expect(finishWorkout).toHaveBeenCalledWith({
      userId: "user",
      sessionId: "session",
    });
    expect(cancelWorkout).not.toHaveBeenCalled();
    expect(getWorkoutSession).toHaveBeenCalledWith({
      userId: "user",
      sessionId: "session",
    });
    expect(revalidatePath).toHaveBeenCalledWith("/v2", "layout");
    expect(revalidatePath).toHaveBeenCalledWith("/workouts/session");
    expect(revalidatePath).toHaveBeenCalledWith("/workouts", "layout");
    expect(revalidatePath).toHaveBeenCalledWith("/templates");
  });
  it("uses abandonment without generating completion results", async () => {
    const cancelled = {
      ...completed,
      status: "cancelled" as const,
      completedAt: null,
    };
    vi.mocked(getWorkoutSession).mockResolvedValue(cancelled);
    expect(await endV2Workout("session", "abandon")).toBe(cancelled);
    expect(cancelWorkout).toHaveBeenCalledWith({
      userId: "user",
      sessionId: "session",
    });
    expect(finishWorkout).not.toHaveBeenCalled();
  });
  it("does not return a successful result when the shared mutation fails", async () => {
    vi.mocked(finishWorkout).mockRejectedValue(
      new Error("Invalid working sets"),
    );
    await expect(endV2Workout("session", "finish")).rejects.toThrow(
      "Invalid working sets",
    );
    expect(getWorkoutSession).not.toHaveBeenCalled();
  });
  it("does not mutate without authentication", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(null);
    await expect(endV2Workout("session", "finish")).rejects.toThrow(
      "redirect:/login",
    );
    expect(finishWorkout).not.toHaveBeenCalled();
    expect(cancelWorkout).not.toHaveBeenCalled();
  });
  it("refreshes active-workout surfaces when recovery finds a closed session", async () => {
    expect(await reloadV2Workout("session")).toBe(completed);
    expect(revalidatePath).toHaveBeenCalledWith("/v2", "layout");
    expect(finishWorkout).not.toHaveBeenCalled();
  });
  it("requires a persisted terminal state after a mutation", async () => {
    vi.mocked(getWorkoutSession).mockResolvedValue({
      ...completed,
      status: "in_progress",
    });
    await expect(endV2Workout("session", "finish")).rejects.toThrow(
      "Unable to confirm",
    );
  });
});
