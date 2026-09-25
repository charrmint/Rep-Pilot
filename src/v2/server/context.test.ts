import { beforeEach, expect, it, vi } from "vitest";
import { getCurrentUser } from "@/features/auth/auth-server-service";
import { getActiveWorkout } from "@/features/workouts/workout-service";
import { getV2Context } from "./context";

vi.mock("react", () => ({ cache: (fn: unknown) => fn }));
vi.mock("next/server", () => ({ connection: vi.fn() }));
vi.mock("next/navigation", () => ({ unstable_rethrow: vi.fn() }));
vi.mock("@/features/auth/auth-server-service", () => ({ getCurrentUser: vi.fn() }));
vi.mock("@/features/workouts/workout-service", () => ({ getActiveWorkout: vi.fn() }));
const user = { id: "owner", email: "owner@example.com" } as NonNullable<Awaited<ReturnType<typeof getCurrentUser>>>;
beforeEach(() => vi.resetAllMocks());

it("does not query personal workouts for signed-out visitors", async () => {
  vi.mocked(getCurrentUser).mockResolvedValue(null);
  expect(await getV2Context()).toEqual({ user: null, activeWorkout: null, activeWorkoutUnavailable: false });
  expect(getActiveWorkout).not.toHaveBeenCalled();
});
it("distinguishes no active workout from an unavailable read", async () => {
  vi.mocked(getCurrentUser).mockResolvedValue(user);
  vi.mocked(getActiveWorkout).mockResolvedValue(null);
  expect(await getV2Context()).toEqual({ user, activeWorkout: null, activeWorkoutUnavailable: false });
  expect(getActiveWorkout).toHaveBeenCalledWith("owner");
});
it("preserves authenticated account access when workout lookup fails", async () => {
  vi.mocked(getCurrentUser).mockResolvedValue(user);
  vi.mocked(getActiveWorkout).mockRejectedValue(new Error("database timeout"));
  expect(await getV2Context()).toEqual({ user, activeWorkout: null, activeWorkoutUnavailable: true });
});
it("does not disguise an authentication failure as a signed-out account", async () => {
  vi.mocked(getCurrentUser).mockRejectedValue(new Error("auth unavailable"));
  await expect(getV2Context()).rejects.toThrow("auth unavailable");
  expect(getActiveWorkout).not.toHaveBeenCalled();
});
