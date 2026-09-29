import { beforeEach, expect, it, vi } from "vitest";
import { getCurrentUser } from "@/features/auth/auth-server-service";
import { createCustomExercise, listExerciseLibrary, setCustomExerciseArchiveStatus } from "@/features/exercises/exercise-service";
import { addWorkoutTemplateExercise, listWorkoutTemplateLibrary } from "@/features/templates/template-service";
import { DEFAULT_WORKOUT_TEMPLATE_EXERCISE_CONFIG } from "@/features/templates/template-defaults";
import { revalidatePath } from "next/cache";
import { mutateV2Exercise } from "./actions";
import type { ExerciseManagerData } from "./types";

vi.mock("@/features/auth/auth-server-service", () => ({ getCurrentUser: vi.fn() }));
vi.mock("@/features/exercises/exercise-service", () => ({ createCustomExercise: vi.fn(), listExerciseLibrary: vi.fn(), setCustomExerciseArchiveStatus: vi.fn() }));
vi.mock("@/features/templates/template-service", () => ({ addWorkoutTemplateExercise: vi.fn(), listWorkoutTemplateLibrary: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("next/navigation", () => ({ unstable_rethrow: vi.fn(), redirect: (url: string) => { throw new Error(`redirect:${url}`); } }));
const data: ExerciseManagerData = {
  exercises: { activeExercises: [{ id: "row", name: "Row", isArchived: false, isSystemExercise: false }, { id: "bench", name: "Bench", isArchived: false, isSystemExercise: true }], archivedCustomExercises: [{ id: "old", name: "Old", isArchived: true, isSystemExercise: false }] },
  plans: [{ id: "upper", name: "Upper", isArchived: false, createdAt: "today", updatedAt: "today", exercises: [] }],
};
function _form(intent: string, values: Record<string, string> = {}) {
  const form = new FormData();
  for (const [key, value] of Object.entries({ intent, exerciseId: "row", templateId: "upper", userId: "attacker", ...values })) form.set(key, value);
  return form;
}
beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(getCurrentUser).mockResolvedValue({ id: "owner" } as NonNullable<Awaited<ReturnType<typeof getCurrentUser>>>);
  vi.mocked(listExerciseLibrary).mockResolvedValue(data.exercises);
  vi.mocked(listWorkoutTemplateLibrary).mockResolvedValue({ activeTemplates: data.plans, archivedTemplates: [] });
});
it("requires authentication before loading or writing", async () => {
  vi.mocked(getCurrentUser).mockResolvedValue(null);
  await expect(mutateV2Exercise(_form("create"))).rejects.toThrow("redirect:/login");
  expect(listExerciseLibrary).not.toHaveBeenCalled();
  expect(createCustomExercise).not.toHaveBeenCalled();
});
it("creates through the validated service with the authenticated owner and invalidates both UIs", async () => {
  expect((await mutateV2Exercise(_form("create", { name: "Cable row" }))).status).toBe("success");
  expect(createCustomExercise).toHaveBeenCalledWith({ userId: "owner", name: "Cable row" });
  expect(revalidatePath).toHaveBeenCalledWith("/v2", "layout");
  expect(revalidatePath).toHaveBeenCalledWith("/templates", "layout");
  expect(revalidatePath).toHaveBeenCalledWith("/exercises");
});
it("returns duplicate-name feedback safely", async () => {
  vi.mocked(createCustomExercise).mockRejectedValue(new Error("An exercise with this name already exists."));
  expect(await mutateV2Exercise(_form("create"))).toMatchObject({ status: "error", data, message: "An exercise with this name already exists." });
});
it.each([["archive", "row", true], ["restore", "old", false]] as const)("%s uses an explicit desired state", async (intent, exerciseId, isArchived) => {
  await mutateV2Exercise(_form(intent, { exerciseId }));
  expect(setCustomExerciseArchiveStatus).toHaveBeenCalledWith({ userId: "owner", exerciseId, isArchived });
});
it.each([["archive", "old"], ["restore", "row"]])("does not repeat a matching %s state", async (intent, exerciseId) => {
  await mutateV2Exercise(_form(intent, { exerciseId }));
  expect(setCustomExerciseArchiveStatus).not.toHaveBeenCalled();
});
it.each(["bench", "missing"])("rejects archive of protected or unavailable exercise %s", async exerciseId => {
  expect((await mutateV2Exercise(_form("archive", { exerciseId }))).status).toBe("error");
  expect(setCustomExerciseArchiveStatus).not.toHaveBeenCalled();
});
it("assigns the existing default prescription with owner-scoped inputs", async () => {
  await mutateV2Exercise(_form("assign"));
  expect(addWorkoutTemplateExercise).toHaveBeenCalledWith({ userId: "owner", templateId: "upper", exerciseId: "row", config: { targetSets: 3, minReps: 8, maxReps: 12, defaultWeightValue: 0, defaultWeightUnit: "lb", weightIncrementLbs: 5 } });
});
it.each<Record<string, string>>([{ exerciseId: "old" }, { templateId: "unowned" }])("rejects archived exercises and ineligible plans", async values => {
  expect((await mutateV2Exercise(_form("assign", values))).status).toBe("error");
  expect(addWorkoutTemplateExercise).not.toHaveBeenCalled();
});
it("verifies state after a lost response and hides provider details", async () => {
  vi.mocked(createCustomExercise).mockRejectedValue(new Error("secret provider details"));
  const result = await mutateV2Exercise(_form("create"));
  expect(result).toMatchObject({ status: "error", data });
  expect(result.message).not.toContain("secret");
  expect(listExerciseLibrary).toHaveBeenCalledTimes(2);
});
it("returns no data when recovery fails and permits a read-only refresh", async () => {
  vi.mocked(listExerciseLibrary).mockRejectedValue(new Error("offline"));
  expect(await mutateV2Exercise(_form("archive"))).toMatchObject({ status: "error", data: null });
  vi.mocked(listExerciseLibrary).mockResolvedValue(data.exercises);
  expect(await mutateV2Exercise(_form("refresh"))).toMatchObject({ status: "success", data });
  expect(setCustomExerciseArchiveStatus).not.toHaveBeenCalled();
});
it("rejects unsupported intent without writing", async () => {
  expect(await mutateV2Exercise(_form("delete"))).toMatchObject({ status: "error", message: "Unknown exercise action." });
  expect(setCustomExerciseArchiveStatus).not.toHaveBeenCalled();
});

it("does not duplicate an assignment that is already saved", async () => {
  vi.mocked(listWorkoutTemplateLibrary).mockResolvedValue({ activeTemplates: [{ ...data.plans[0], exercises: [{ id: "entry", templateId: "upper", exerciseIsArchived: false, exerciseIsSystemExercise: false, exerciseId: "row", exerciseName: "Row", position: 0, config: { ...DEFAULT_WORKOUT_TEMPLATE_EXERCISE_CONFIG, defaultNormalizedWeightLbs: 0 } }] }], archivedTemplates: [] });
  expect((await mutateV2Exercise(_form("assign"))).status).toBe("success");
  expect(addWorkoutTemplateExercise).not.toHaveBeenCalled();
});
