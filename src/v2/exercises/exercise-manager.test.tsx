import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { ExerciseManager } from "./exercise-manager";
import { mutateV2Exercise } from "./actions";
import type { ExerciseManagerData, ExerciseMutationResult } from "./types";
vi.mock("./actions", () => ({ mutateV2Exercise: vi.fn() }));
vi.mock("../workouts/actions", () => ({ startV2Workout: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }), unstable_rethrow: vi.fn() }));
const data: ExerciseManagerData = {
  exercises: { activeExercises: [{ id: "row", name: "Row", isArchived: false, isSystemExercise: false }, { id: "bench", name: "Bench", isArchived: false, isSystemExercise: true }], archivedCustomExercises: [{ id: "old", name: "Old", isArchived: true, isSystemExercise: false }] },
  plans: [{ id: "upper", name: "Upper", isArchived: false, createdAt: "today", updatedAt: "today", exercises: [] }],
};
beforeEach(() => {
  vi.resetAllMocks();
  vi.spyOn(window, "confirm").mockReturnValue(true);
  vi.mocked(mutateV2Exercise).mockResolvedValue({ status: "success", data, message: "Saved." });
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); });
it("preserves failed creation drafts and clears them only on success", async () => {
  vi.mocked(mutateV2Exercise).mockResolvedValueOnce({ status: "error", data, message: "Name exists." });
  render(<ExerciseManager initialData={data} />);
  fireEvent.change(screen.getByLabelText("Exercise name"), { target: { value: "Row" } });
  fireEvent.submit(screen.getByRole("form", { name: "Create exercise" }));
  expect(await screen.findByRole("alert")).toHaveTextContent("Name exists.");
  expect(screen.getByLabelText("Exercise name")).toHaveValue("Row");
  fireEvent.submit(screen.getByRole("form", { name: "Create exercise" }));
  await waitFor(() => expect(screen.getByLabelText("Exercise name")).toHaveValue(""));
});
it("protects built-ins, confirms archive, and restores without confirmation", async () => {
  render(<ExerciseManager initialData={data} />);
  expect(screen.queryByRole("button", { name: "Archive Bench" })).not.toBeInTheDocument();
  vi.mocked(window.confirm).mockReturnValueOnce(false);
  fireEvent.click(screen.getByRole("button", { name: "Archive Row" }));
  expect(mutateV2Exercise).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole("button", { name: "Archived" }));
  fireEvent.click(screen.getByRole("button", { name: "Restore Old" }));
  await waitFor(() => expect(mutateV2Exercise).toHaveBeenCalledTimes(1));
  expect(vi.mocked(mutateV2Exercise).mock.calls[0][0].get("intent")).toBe("restore");
  expect(window.confirm).toHaveBeenCalledTimes(1);
});
it("locks all writes on an uncertain response until recovery succeeds", async () => {
  vi.mocked(mutateV2Exercise).mockRejectedValueOnce(new Error("network lost"));
  render(<ExerciseManager initialData={data} />);
  fireEvent.click(screen.getByRole("button", { name: "Archive Row" }));
  expect(await screen.findByRole("heading", { name: "Saved library unavailable" })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Create exercise" })).toBeDisabled();
  expect(screen.getByRole("button", { name: "Archive Row" })).toBeDisabled();
  fireEvent.click(screen.getByRole("button", { name: "Check saved library" }));
  await waitFor(() => expect(screen.getByRole("button", { name: "Archive Row" })).toBeEnabled());
  expect(vi.mocked(mutateV2Exercise).mock.calls[1][0].get("intent")).toBe("refresh");
});
it("prevents duplicate submissions and shares the pending lock", async () => {
  let finish!: (result: ExerciseMutationResult) => void;
  vi.mocked(mutateV2Exercise).mockReturnValue(new Promise(resolve => { finish = resolve; }));
  render(<ExerciseManager initialData={data} />);
  const form = screen.getByRole("form", { name: "Create exercise" });
  fireEvent.submit(form); fireEvent.submit(form);
  expect(mutateV2Exercise).toHaveBeenCalledTimes(1);
  expect(screen.getByRole("button", { name: "Archive Row" })).toBeDisabled();
  finish({ status: "success", data, message: "Saved." });
  await waitFor(() => expect(screen.getByRole("button", { name: "Archive Row" })).toBeEnabled());
});
it("assigns the selected plan and links to its editor", async () => {
  render(<ExerciseManager initialData={data} />);
  const row = screen.getByRole("heading", { name: "Row" }).closest("li")!;
  fireEvent.click(within(row).getByText("Add to plan", { exact: true }));
  fireEvent.change(within(row).getByRole("combobox"), { target: { value: "upp" } });
  fireEvent.click(within(row).getByRole("option", { name: "Upper" }));
  fireEvent.submit(within(row).getByRole("form"));
  expect(await screen.findByRole("link", { name: "Edit plan prescription" })).toHaveAttribute("href", "/v2/library/plans/upper");
  expect(vi.mocked(mutateV2Exercise).mock.calls[0][0].get("exerciseId")).toBe("row");
  expect(vi.mocked(mutateV2Exercise).mock.calls[0][0].get("templateId")).toBe("upper");
});

it("removes archived rows from active results while preserving search and the creation draft", async () => {
  const archived = { ...data, exercises: { activeExercises: [data.exercises.activeExercises[1]], archivedCustomExercises: [...data.exercises.archivedCustomExercises, { ...data.exercises.activeExercises[0], isArchived: true }] } };
  vi.mocked(mutateV2Exercise).mockResolvedValue({ status: "success", data: archived, message: "Exercise archived." });
  render(<ExerciseManager initialData={data} />);
  fireEvent.change(screen.getByLabelText("Exercise name"), { target: { value: "New move" } });
  fireEvent.change(screen.getByRole("searchbox"), { target: { value: "Row" } });
  fireEvent.click(screen.getByRole("button", { name: "Archive Row" }));
  await waitFor(() => expect(screen.queryByRole("heading", { name: "Row" })).not.toBeInTheDocument());
  expect(screen.getByRole("searchbox")).toHaveValue("Row");
  expect(screen.getByLabelText("Exercise name")).toHaveValue("New move");
  fireEvent.click(screen.getByRole("button", { name: "Archived" }));
  expect(screen.getByRole("button", { name: "Restore Row" })).toBeInTheDocument();
});
it("provides a v2 plan creation path when there are no active plans", () => {
  render(<ExerciseManager initialData={{ ...data, plans: [] }} />);
  for (const link of screen.getAllByRole("link", { name: "Create a plan" })) expect(link).toHaveAttribute("href", "/v2/library/plans/new");
});
