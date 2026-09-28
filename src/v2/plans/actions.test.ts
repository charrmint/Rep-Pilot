import { beforeEach, expect, it, vi } from "vitest";
import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/features/auth/auth-server-service";
import { createWorkoutTemplateRow, listWorkoutTemplateRows, updateWorkoutTemplateNameRow } from "@/features/templates/template-queries";
import type { WorkoutTemplateRow } from "@/features/templates/types";
import { createV2Plan, renameV2Plan } from "./actions";

vi.mock("@/features/auth/auth-server-service", () => ({ getCurrentUser: vi.fn() }));
vi.mock("@/features/templates/template-queries", () => ({
  createWorkoutTemplateRow: vi.fn(), listWorkoutTemplateRows: vi.fn(), updateWorkoutTemplateNameRow: vi.fn(),
}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("next/navigation", () => ({ redirect: (url: string) => { throw new Error(`redirect:${url}`); } }));
const row: WorkoutTemplateRow = { id: "plan", user_id: "owner", name: "Upper body", is_archived: false, created_at: "2026-09-27", updated_at: "2026-09-27" };
function _data(name: string) {
  const data = new FormData();
  data.set("name", name); data.set("templateId", "plan"); data.set("userId", "untrusted");
  return data;
}
beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(getCurrentUser).mockResolvedValue({ id: "owner" } as NonNullable<Awaited<ReturnType<typeof getCurrentUser>>>);
  vi.mocked(listWorkoutTemplateRows).mockResolvedValue([]);
  vi.mocked(createWorkoutTemplateRow).mockResolvedValue(row);
  vi.mocked(updateWorkoutTemplateNameRow).mockResolvedValue(row);
});
it("creates through shared normalization as the authenticated owner and refreshes both interfaces", async () => {
  expect(await createV2Plan(_data("  Upper   body  "))).toEqual({ status: "success", plan: { id: "plan", name: "Upper body" } });
  expect(createWorkoutTemplateRow).toHaveBeenCalledWith({ user_id: "owner", name: "Upper body" });
  expect(listWorkoutTemplateRows).toHaveBeenCalledWith("owner");
  expect(revalidatePath).toHaveBeenCalledWith("/v2", "layout");
  expect(revalidatePath).toHaveBeenCalledWith("/templates");
  expect(revalidatePath).toHaveBeenCalledWith("/templates/plan/edit");
  expect(revalidatePath).toHaveBeenCalledWith("/workouts", "layout");
});
it("renames the existing ID and allows its own current name", async () => {
  vi.mocked(listWorkoutTemplateRows).mockResolvedValue([row]);
  expect((await renameV2Plan(_data(" Upper body "))).status).toBe("success");
  expect(updateWorkoutTemplateNameRow).toHaveBeenCalledWith({ userId: "owner", templateId: "plan", name: "Upper body" });
  expect(createWorkoutTemplateRow).not.toHaveBeenCalled();
  expect(revalidatePath).toHaveBeenCalledWith("/v2", "layout");
});
it.each([createV2Plan, renameV2Plan])("rejects blank and overlong names before writing", async (action) => {
  expect(await action(_data("   "))).toEqual({ status: "error", message: "Enter a plan name." });
  expect(await action(_data("x".repeat(81)))).toMatchObject({ status: "error" });
  expect(createWorkoutTemplateRow).not.toHaveBeenCalled();
  expect(updateWorkoutTemplateNameRow).not.toHaveBeenCalled();
  expect(revalidatePath).not.toHaveBeenCalled();
});
it.each([createV2Plan, renameV2Plan])("preserves duplicate checks against archived plans", async (action) => {
  vi.mocked(listWorkoutTemplateRows).mockResolvedValue([{ ...row, id: "other", is_archived: true }]);
  expect(await action(_data("upper BODY"))).toMatchObject({ status: "error", message: expect.stringContaining("including archived plans") });
  expect(createWorkoutTemplateRow).not.toHaveBeenCalled();
  expect(updateWorkoutTemplateNameRow).not.toHaveBeenCalled();
});
it.each([createV2Plan, renameV2Plan])("requires authentication before reads or writes", async (action) => {
  vi.mocked(getCurrentUser).mockResolvedValue(null);
  await expect(action(_data("Upper"))).rejects.toThrow("redirect:/login");
  expect(listWorkoutTemplateRows).not.toHaveBeenCalled();
  expect(createWorkoutTemplateRow).not.toHaveBeenCalled();
  expect(updateWorkoutTemplateNameRow).not.toHaveBeenCalled();
});
it("hides provider details and does not report success after a failed write", async () => {
  vi.mocked(updateWorkoutTemplateNameRow).mockRejectedValue(new Error("private provider detail"));
  expect(await renameV2Plan(_data("Upper"))).toEqual({ status: "error", message: "We couldn’t confirm the save. Check your library before trying again." });
  expect(revalidatePath).not.toHaveBeenCalled();
});
