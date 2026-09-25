import { beforeEach, expect, it, vi } from "vitest";
import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/features/auth/auth-server-service";
import { saveWorkoutSet, deleteWorkoutSet, startWorkout } from "./workout-service";
import { saveWorkoutSetAction, deleteWorkoutSetAction, startWorkoutAction, finishWorkoutAction, cancelWorkoutAction } from "./workout-actions";

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("next/navigation", () => ({ redirect: vi.fn((url: string) => { throw new Error(`redirect:${url}`); }) }));
vi.mock("@/features/auth/auth-server-service", () => ({ getCurrentUser: vi.fn() }));
vi.mock("./workout-service", () => ({ saveWorkoutSet: vi.fn(), deleteWorkoutSet: vi.fn(), startWorkout: vi.fn(), finishWorkout: vi.fn(), cancelWorkout: vi.fn() }));
beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(getCurrentUser).mockResolvedValue({ id: "owner" } as NonNullable<Awaited<ReturnType<typeof getCurrentUser>>>);
});
const input = { sessionExerciseId: "exercise", position: 1, weightValue: 100, weightUnit: "lb" as const, reps: 8 };
it("invalidates Today only after saved-set mutations succeed", async () => {
  await saveWorkoutSetAction(input);
  expect(saveWorkoutSet).toHaveBeenCalledWith({ userId: "owner", input });
  expect(revalidatePath).toHaveBeenCalledWith("/v2");
  vi.mocked(revalidatePath).mockClear();
  const deletion = { sessionExerciseId: "exercise", workoutSetId: "set" };
  await deleteWorkoutSetAction(deletion);
  expect(deleteWorkoutSet).toHaveBeenCalledWith({ userId: "owner", input: deletion });
  expect(revalidatePath).toHaveBeenCalledWith("/v2");
});
it("does not report refreshed progress after a failed mutation", async () => {
  vi.mocked(saveWorkoutSet).mockRejectedValue(new Error("save failed"));
  await expect(saveWorkoutSetAction(input)).rejects.toThrow("save failed");
  expect(revalidatePath).not.toHaveBeenCalled();
});
it("refreshes v2 status after classic lifecycle changes while retaining classic destinations", async () => {
  vi.mocked(startWorkout).mockResolvedValue("live");
  await expect(startWorkoutAction({ templateId: "plan" })).rejects.toThrow("redirect:/workouts/live");
  expect(revalidatePath).toHaveBeenCalledWith("/v2", "layout");
  vi.mocked(revalidatePath).mockClear();
  await expect(finishWorkoutAction("live")).rejects.toThrow("redirect:/workouts/live");
  expect(revalidatePath).toHaveBeenCalledWith("/v2", "layout");
  vi.mocked(revalidatePath).mockClear();
  await expect(cancelWorkoutAction("live")).rejects.toThrow("redirect:/templates");
  expect(revalidatePath).toHaveBeenCalledWith("/v2", "layout");
});
