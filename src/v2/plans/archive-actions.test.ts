import { beforeEach, expect, it, vi } from "vitest";
import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/features/auth/auth-server-service";
import { listAvailableExercises } from "@/features/exercises/exercise-service";
import { getWorkoutTemplateDetails } from "@/features/templates/template-service";
import { updateWorkoutTemplateArchiveStatusRow } from "@/features/templates/template-queries";
import type { WorkoutTemplateDetails, WorkoutTemplateRow } from "@/features/templates/types";
import { mutateV2PlanArchive } from "./archive-actions";

vi.mock("@/features/auth/auth-server-service", () => ({ getCurrentUser: vi.fn() }));
vi.mock("@/features/exercises/exercise-service", () => ({ listAvailableExercises: vi.fn() }));
vi.mock("@/features/templates/template-service", async importOriginal => ({ ...await importOriginal<typeof import("@/features/templates/template-service")>(), getWorkoutTemplateDetails: vi.fn() }));
vi.mock("@/features/templates/template-queries", () => ({ updateWorkoutTemplateArchiveStatusRow: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("next/navigation", () => ({ unstable_rethrow: vi.fn(), redirect: (url: string) => { throw new Error(`redirect:${url}`); } }));
const plan: WorkoutTemplateDetails = { id: "plan", name: "Upper", isArchived: false, createdAt: "today", updatedAt: "today", exercises: [] };
const row: WorkoutTemplateRow = { id: "plan", user_id: "owner", name: "Upper", is_archived: true, created_at: "today", updated_at: "today" };
function _data(intent: string) {
  const data = new FormData();
  data.set("templateId", "plan"); data.set("intent", intent); data.set("userId", "someone-else");
  return data;
}
beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(getCurrentUser).mockResolvedValue({ id: "owner" } as NonNullable<Awaited<ReturnType<typeof getCurrentUser>>>);
  vi.mocked(getWorkoutTemplateDetails).mockResolvedValue(plan);
  vi.mocked(listAvailableExercises).mockResolvedValue([]);
  vi.mocked(updateWorkoutTemplateArchiveStatusRow).mockResolvedValue(row);
});
it.each([true, false])("sets archive status to %s through the owned service and refreshes both interfaces", async (isArchived) => {
  vi.mocked(getWorkoutTemplateDetails).mockResolvedValueOnce({ ...plan, isArchived: !isArchived }).mockResolvedValue({ ...plan, isArchived });
  const result = await mutateV2PlanArchive(_data(isArchived ? "archive" : "restore"));
  expect(result).toMatchObject({ status: "success", data: { plan: { id: "plan", isArchived } } });
  expect(updateWorkoutTemplateArchiveStatusRow).toHaveBeenCalledExactlyOnceWith({ userId: "owner", templateId: "plan", isArchived });
  expect(getWorkoutTemplateDetails).toHaveBeenCalledWith({ userId: "owner", templateId: "plan" });
  expect(revalidatePath).toHaveBeenCalledWith("/v2", "layout");
  expect(revalidatePath).toHaveBeenCalledWith("/templates");
  expect(revalidatePath).toHaveBeenCalledWith("/templates/plan/edit");
});
it.each([true, false])("does not toggle or rewrite an already matching archive state %s", async (isArchived) => {
  vi.mocked(getWorkoutTemplateDetails).mockResolvedValue({ ...plan, isArchived });
  expect((await mutateV2PlanArchive(_data(isArchived ? "archive" : "restore"))).status).toBe("success");
  expect(updateWorkoutTemplateArchiveStatusRow).not.toHaveBeenCalled();
});
it("requires authentication before reads or writes", async () => {
  vi.mocked(getCurrentUser).mockResolvedValue(null);
  await expect(mutateV2PlanArchive(_data("archive"))).rejects.toThrow("redirect:/login");
  expect(getWorkoutTemplateDetails).not.toHaveBeenCalled();
  expect(updateWorkoutTemplateArchiveStatusRow).not.toHaveBeenCalled();
});
it("preserves authentication failures", async () => {
  vi.mocked(getCurrentUser).mockRejectedValue(new Error("auth unavailable"));
  await expect(mutateV2PlanArchive(_data("restore"))).rejects.toThrow("auth unavailable");
});
it("does not write missing or unowned plans", async () => {
  vi.mocked(getWorkoutTemplateDetails).mockResolvedValue(null);
  expect(await mutateV2PlanArchive(_data("archive"))).toMatchObject({ status: "error", data: null, message: "This plan is no longer available." });
  expect(updateWorkoutTemplateArchiveStatusRow).not.toHaveBeenCalled();
});
it("rejects unsupported intent rather than treating it as restore", async () => {
  expect(await mutateV2PlanArchive(_data("delete"))).toMatchObject({ status: "error", message: "Unknown plan action." });
  expect(updateWorkoutTemplateArchiveStatusRow).not.toHaveBeenCalled();
});
it("returns actual persisted state after a lost response without leaking provider details", async () => {
  vi.mocked(updateWorkoutTemplateArchiveStatusRow).mockRejectedValue(new Error("private provider error"));
  vi.mocked(getWorkoutTemplateDetails).mockResolvedValueOnce(plan).mockResolvedValue({ ...plan, isArchived: true });
  expect(await mutateV2PlanArchive(_data("archive"))).toMatchObject({ status: "error", data: { plan: { isArchived: true } }, message: expect.stringContaining("couldn’t confirm") });
  expect(revalidatePath).toHaveBeenCalledWith("/v2", "layout");
});
it("locks recovery when a successful write cannot be verified", async () => {
  vi.mocked(getWorkoutTemplateDetails).mockResolvedValueOnce(plan).mockRejectedValue(new Error("offline"));
  expect(await mutateV2PlanArchive(_data("archive"))).toMatchObject({ status: "error", data: null });
  expect(updateWorkoutTemplateArchiveStatusRow).toHaveBeenCalledOnce();
});
