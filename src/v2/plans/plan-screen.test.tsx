import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { getV2Context } from "../server/context";
import { getWorkoutTemplateDetails } from "@/features/templates/template-service";
import { NewPlanScreen, PlanScreen } from "./plan-screen";
vi.mock("../server/context", () => ({ getV2Context: vi.fn() }));
vi.mock("@/features/templates/template-service", () => ({ getWorkoutTemplateDetails: vi.fn() }));
vi.mock("./actions", () => ({ createV2Plan: vi.fn(), renameV2Plan: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh() {}, replace() {} }), unstable_rethrow: vi.fn(), notFound: () => { throw new Error("not-found"); }, redirect: (url: string) => { throw new Error(`redirect:${url}`); } }));
afterEach(cleanup);
beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(getV2Context).mockResolvedValue({ user: { id: "owner" } as NonNullable<Awaited<ReturnType<typeof getV2Context>>["user"]>, activeWorkout: null, activeWorkoutUnavailable: true });
  vi.mocked(getWorkoutTemplateDetails).mockResolvedValue({ id: "plan", name: "Upper", isArchived: false, createdAt: "2026-09-27", updatedAt: "2026-09-27", exercises: [] });
});
it("opens an owned empty plan even when workout status is unavailable", async () => {
  render(await PlanScreen({ templateId: "plan" }));
  expect(getWorkoutTemplateDetails).toHaveBeenCalledWith({ userId: "owner", templateId: "plan" });
  expect(screen.getByRole("heading", { name: "Upper" })).toBeInTheDocument();
  expect(screen.getByText(/No exercises yet/)).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "Add exercises in classic" })).toHaveAttribute("href", "/templates/plan/edit");
});
it("does not render an unavailable or another owner's plan", async () => {
  vi.mocked(getWorkoutTemplateDetails).mockResolvedValue(null);
  await expect(PlanScreen({ templateId: "missing" })).rejects.toThrow("not-found");
});
it("requires authentication before plan reads and creation UI", async () => {
  vi.mocked(getV2Context).mockResolvedValue({ user: null, activeWorkout: null, activeWorkoutUnavailable: false });
  await expect(PlanScreen({ templateId: "plan" })).rejects.toThrow("redirect:/login");
  await expect(NewPlanScreen()).rejects.toThrow("redirect:/login");
  expect(getWorkoutTemplateDetails).not.toHaveBeenCalled();
});
it("shows an archived plan and its restore handoff", async () => {
  const plan = await getWorkoutTemplateDetails({ userId: "owner", templateId: "plan" });
  vi.mocked(getWorkoutTemplateDetails).mockResolvedValue({ ...plan!, isArchived: true });
  render(await PlanScreen({ templateId: "plan" }));
  expect(screen.getByText("Library · Archived plan")).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "Restore this plan in classic" })).toHaveAttribute("href", "/templates");
});
