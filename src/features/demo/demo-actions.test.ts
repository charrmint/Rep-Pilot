import { beforeEach, expect, it, vi } from "vitest";
import { revalidatePath } from "next/cache";
import { getCurrentUser, signInAnonymously } from "@/features/auth/auth-server-service";
import { provisionDemoData } from "./demo-service";
import { startDemoAction } from "./demo-actions";
import { INITIAL_FORM_ACTION_STATE } from "@/app/_shared/form-action-state";
vi.mock("@/features/auth/auth-server-service", () => ({ getCurrentUser: vi.fn(), signInAnonymously: vi.fn() }));
vi.mock("./demo-service", () => ({ provisionDemoData: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("next/navigation", () => ({ redirect: (url: string) => { throw new Error(`redirect:${url}`); } }));
const demo = { id: "demo", is_anonymous: true } as NonNullable<Awaited<ReturnType<typeof getCurrentUser>>>;
beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(getCurrentUser).mockResolvedValue(null);
  vi.mocked(signInAnonymously).mockResolvedValue(demo);
  vi.mocked(provisionDemoData).mockResolvedValue(undefined);
});
it.each([false, true])("opens v2 for new and existing demo sessions (existing=%s)", async existing => {
  if (existing) vi.mocked(getCurrentUser).mockResolvedValue(demo);
  await expect(startDemoAction(INITIAL_FORM_ACTION_STATE, new FormData())).rejects.toThrow("redirect:/v2");
  expect(signInAnonymously).toHaveBeenCalledTimes(existing ? 0 : 1);
  expect(provisionDemoData).toHaveBeenCalledExactlyOnceWith({ userId: "demo", isAnonymous: true });
  expect(revalidatePath).toHaveBeenCalledWith("/v2", "layout");
  expect(revalidatePath).toHaveBeenCalledWith("/templates");
});
it("keeps regular users in their account without provisioning demo data", async () => {
  vi.mocked(getCurrentUser).mockResolvedValue({ ...demo, is_anonymous: false });
  await expect(startDemoAction(INITIAL_FORM_ACTION_STATE, new FormData())).rejects.toThrow("redirect:/v2");
  expect(provisionDemoData).not.toHaveBeenCalled();
  expect(signInAnonymously).not.toHaveBeenCalled();
});
it("returns failure feedback without navigating or claiming demo readiness", async () => {
  vi.mocked(provisionDemoData).mockRejectedValue(new Error("Unable to prepare demo"));
  expect(await startDemoAction(INITIAL_FORM_ACTION_STATE, new FormData())).toMatchObject({ status: "error", message: "Unable to prepare demo" });
  expect(revalidatePath).not.toHaveBeenCalled();
});
it("preserves authentication read failures rather than creating a replacement session", async () => {
  vi.mocked(getCurrentUser).mockRejectedValue(new Error("auth unavailable"));
  await expect(startDemoAction(INITIAL_FORM_ACTION_STATE, new FormData())).rejects.toThrow("auth unavailable");
  expect(signInAnonymously).not.toHaveBeenCalled();
});
