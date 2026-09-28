import { beforeEach, expect, it, vi } from "vitest";
import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/features/auth/auth-server-service";
import { listAvailableExercises } from "@/features/exercises/exercise-service";
import { getWorkoutTemplateDetails } from "@/features/templates/template-service";
import { createWorkoutTemplateExerciseRow, deleteWorkoutTemplateExerciseRow, listWorkoutTemplateExerciseRows, updateWorkoutTemplateExerciseConfigRow, updateWorkoutTemplateExercisePositionRow } from "@/features/templates/template-queries";
import type { WorkoutTemplateDetails, WorkoutTemplateExerciseRowWithExercise } from "@/features/templates/types";
import { mutateV2PlanExercise, reloadV2Plan } from "./exercise-actions";

vi.mock("@/features/auth/auth-server-service", () => ({ getCurrentUser: vi.fn() }));
vi.mock("@/features/exercises/exercise-service", () => ({ listAvailableExercises: vi.fn() }));
vi.mock("@/features/templates/template-service", async importOriginal => ({ ...await importOriginal<typeof import("@/features/templates/template-service")>(), getWorkoutTemplateDetails: vi.fn() }));
vi.mock("@/features/templates/template-queries", () => ({ createWorkoutTemplateExerciseRow: vi.fn(), deleteWorkoutTemplateExerciseRow: vi.fn(), listWorkoutTemplateExerciseRows: vi.fn(), updateWorkoutTemplateExerciseConfigRow: vi.fn(), updateWorkoutTemplateExercisePositionRow: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("next/navigation", () => ({ redirect: (url: string) => { throw new Error(`redirect:${url}`); } }));
const row: WorkoutTemplateExerciseRowWithExercise = {
  id: "configured", user_id: "owner", template_id: "plan", exercise_id: "bench", position: 1,
  target_sets: 3, min_reps: 8, max_reps: 12, default_weight_value: 20, default_weight_unit: "kg", default_normalized_weight_lbs: 44, weight_increment_lbs: 5,
  created_at: "today", updated_at: "today", exercise: { id: "bench", name: "Bench", user_id: null, is_archived: false },
};
const plan: WorkoutTemplateDetails = { id: "plan", name: "Upper", isArchived: false, createdAt: "today", updatedAt: "today", exercises: [{
  id: row.id, templateId: "plan", exerciseId: "bench", exerciseName: "Bench", position: 1, exerciseIsArchived: false, exerciseIsSystemExercise: true,
  config: { targetSets: 3, minReps: 8, maxReps: 12, defaultWeightValue: 20, defaultWeightUnit: "kg", defaultNormalizedWeightLbs: 44, weightIncrementLbs: 5 },
}] };
function _data(intent: string, overrides: Record<string, string> = {}) {
  const data = new FormData();
  Object.entries({ intent, userId: "untrusted", templateId: "plan", templateExerciseId: "configured", exerciseId: "curl", targetSets: "3", minReps: "8", maxReps: "12", defaultWeightValue: "20", defaultWeightUnit: "kg", weightIncrementLbs: "5", ...overrides }).forEach(([key, value]) => data.set(key, value));
  return data;
}
beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(getCurrentUser).mockResolvedValue({ id: "owner" } as NonNullable<Awaited<ReturnType<typeof getCurrentUser>>>);
  vi.mocked(getWorkoutTemplateDetails).mockResolvedValue(plan);
  vi.mocked(listAvailableExercises).mockResolvedValue([{ id: "curl", name: "Curl", isArchived: false, isSystemExercise: true }, { id: "bench", name: "Bench", isArchived: false, isSystemExercise: true }]);
  vi.mocked(listWorkoutTemplateExerciseRows).mockResolvedValue([row]);
  vi.mocked(updateWorkoutTemplateExerciseConfigRow).mockResolvedValue(row);
  vi.mocked(createWorkoutTemplateExerciseRow).mockResolvedValue({ ...row, id: "added", exercise_id: "curl" });
});
it("saves owned configuration through shared validation and kg normalization without converting increments", async () => {
  const result = await mutateV2PlanExercise(_data("save"));
  expect(result.status).toBe("success");
  expect(updateWorkoutTemplateExerciseConfigRow).toHaveBeenCalledWith({ userId: "owner", templateId: "plan", templateExerciseId: "configured", update: expect.objectContaining({ default_weight_value: 20, default_weight_unit: "kg", default_normalized_weight_lbs: 44, weight_increment_lbs: 5 }) });
  expect(getWorkoutTemplateDetails).toHaveBeenCalledWith({ userId: "owner", templateId: "plan" });
  expect(revalidatePath).toHaveBeenCalledWith("/v2", "layout");
  expect(revalidatePath).toHaveBeenCalledWith("/templates/plan/edit");
});
it("adds at the next position through the existing service", async () => {
  vi.mocked(listWorkoutTemplateExerciseRows).mockResolvedValueOnce([row]).mockResolvedValueOnce([row, { ...row, id: "added", exercise_id: "curl", position: 2 }]);
  expect((await mutateV2PlanExercise(_data("add"))).status).toBe("success");
  expect(createWorkoutTemplateExerciseRow).toHaveBeenCalledWith(expect.objectContaining({ user_id: "owner", template_id: "plan", exercise_id: "curl", position: 2, default_normalized_weight_lbs: 44 }));
});
it.each<Record<string, string>>([
  { targetSets: "0" }, { targetSets: "1.5" }, { minReps: "13" }, { defaultWeightValue: "-1" },
  { defaultWeightValue: "" }, { defaultWeightValue: "NaN" }, { defaultWeightUnit: "stone" }, { weightIncrementLbs: "0" },
])("rejects invalid configuration %j before writes", async (fields) => {
  const result = await mutateV2PlanExercise(_data("save", fields));
  expect(result.status).toBe("error");
  expect(result.data?.plan).toBe(plan);
  expect(updateWorkoutTemplateExerciseConfigRow).not.toHaveBeenCalled();
});
it("rejects duplicate exercises using the existing service check", async () => {
  expect(await mutateV2PlanExercise(_data("add", { exerciseId: "bench" }))).toMatchObject({ status: "error", message: "This exercise is already in your plan." });
  expect(createWorkoutTemplateExerciseRow).not.toHaveBeenCalled();
});
it("rejects unavailable exercises and IDs outside the loaded plan", async () => {
  expect((await mutateV2PlanExercise(_data("add", { exerciseId: "private" }))).status).toBe("error");
  expect((await mutateV2PlanExercise(_data("remove", { templateExerciseId: "other-plan-row" }))).status).toBe("error");
  expect(createWorkoutTemplateExerciseRow).not.toHaveBeenCalled();
  expect(deleteWorkoutTemplateExerciseRow).not.toHaveBeenCalled();
});
it("requires authentication and an owned plan before mutations", async () => {
  vi.mocked(getCurrentUser).mockResolvedValue(null);
  await expect(mutateV2PlanExercise(_data("save"))).rejects.toThrow("redirect:/login");
  await expect(reloadV2Plan("plan")).rejects.toThrow("redirect:/login");
  expect(getWorkoutTemplateDetails).not.toHaveBeenCalled();
  vi.mocked(getCurrentUser).mockResolvedValue({ id: "owner" } as NonNullable<Awaited<ReturnType<typeof getCurrentUser>>>);
  vi.mocked(getWorkoutTemplateDetails).mockResolvedValue(null);
  expect(await mutateV2PlanExercise(_data("save"))).toMatchObject({ status: "error", data: null });
  expect(updateWorkoutTemplateExerciseConfigRow).not.toHaveBeenCalled();
});
it("moves using the shared position swap and returns a fresh snapshot", async () => {
  vi.mocked(listWorkoutTemplateExerciseRows).mockResolvedValue([row, { ...row, id: "second", position: 2 }]);
  expect((await mutateV2PlanExercise(_data("move_down"))).status).toBe("success");
  expect(updateWorkoutTemplateExercisePositionRow).toHaveBeenNthCalledWith(1, { userId: "owner", templateId: "plan", templateExerciseId: "configured", position: 3 });
  expect(updateWorkoutTemplateExercisePositionRow).toHaveBeenNthCalledWith(2, { userId: "owner", templateId: "plan", templateExerciseId: "second", position: 1 });
  expect(updateWorkoutTemplateExercisePositionRow).toHaveBeenNthCalledWith(3, { userId: "owner", templateId: "plan", templateExerciseId: "configured", position: 2 });
});
it("reloads and invalidates after a partially failed reorder without leaking provider details", async () => {
  vi.mocked(listWorkoutTemplateExerciseRows).mockResolvedValue([row, { ...row, id: "second", position: 2 }]);
  vi.mocked(updateWorkoutTemplateExercisePositionRow).mockResolvedValueOnce(row).mockRejectedValueOnce(new Error("private provider detail"));
  const result = await mutateV2PlanExercise(_data("move_down"));
  expect(result).toMatchObject({ status: "error", data: { plan }, message: "We couldn’t confirm the change. Review the saved plan before trying again." });
  expect(getWorkoutTemplateDetails).toHaveBeenCalledTimes(2);
  expect(revalidatePath).toHaveBeenCalledWith("/v2", "layout");
});
it("returns a locked recovery state when the read after failure also fails", async () => {
  vi.mocked(updateWorkoutTemplateExerciseConfigRow).mockRejectedValue(new Error("offline"));
  vi.mocked(getWorkoutTemplateDetails).mockResolvedValueOnce(plan).mockRejectedValueOnce(new Error("offline"));
  expect(await mutateV2PlanExercise(_data("save"))).toMatchObject({ status: "error", data: null });
});
it("removes and compacts positions using the existing service", async () => {
  vi.mocked(listWorkoutTemplateExerciseRows).mockResolvedValue([{ ...row, id: "remaining", position: 2 }]);
  expect((await mutateV2PlanExercise(_data("remove"))).status).toBe("success");
  expect(deleteWorkoutTemplateExerciseRow).toHaveBeenCalledWith({ userId: "owner", templateId: "plan", templateExerciseId: "configured" });
  expect(updateWorkoutTemplateExercisePositionRow).toHaveBeenCalledWith({ userId: "owner", templateId: "plan", templateExerciseId: "remaining", position: 1 });
});
