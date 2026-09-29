import { act, cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { PlanEditor } from "./plan-editor";
import { mutateV2PlanExercise, reloadV2Plan } from "./exercise-actions";
import { renameV2Plan } from "./actions";
import type { PlanEditorData, PlanMutationResult } from "./types";

const router = vi.hoisted(() => ({ refresh: vi.fn(), replace: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => router, unstable_rethrow: vi.fn() }));
vi.mock("./exercise-actions", () => ({ mutateV2PlanExercise: vi.fn(), reloadV2Plan: vi.fn() }));
vi.mock("./actions", () => ({ renameV2Plan: vi.fn(), createV2Plan: vi.fn() }));
const config = { targetSets: 3, minReps: 8, maxReps: 12, defaultWeightValue: 20, defaultWeightUnit: "kg" as const, defaultNormalizedWeightLbs: 44, weightIncrementLbs: 5 };
const base: PlanEditorData = {
  plan: { id: "plan", name: "Upper", isArchived: false, createdAt: "today", updatedAt: "today", exercises: [
    { id: "bench-row", templateId: "plan", exerciseId: "bench", exerciseName: "Bench press", exerciseIsArchived: false, exerciseIsSystemExercise: true, position: 1, config },
    { id: "row-row", templateId: "plan", exerciseId: "row", exerciseName: "Cable row", exerciseIsArchived: true, exerciseIsSystemExercise: false, position: 2, config },
  ] },
  availableExercises: [
    { id: "bench", name: "Bench press", isArchived: false, isSystemExercise: true },
    { id: "squat", name: "Squat", isArchived: false, isSystemExercise: true },
    { id: "curl", name: "Cable curl", isArchived: false, isSystemExercise: false },
    { id: "old", name: "Old lift", isArchived: true, isSystemExercise: false },
  ],
};
function _form(name: string) { return screen.getByRole("form", { name }); }
function _sets(name: string) { return within(_form(`Configure ${name}`)).getByLabelText("Sets"); }
function _success(data = base): PlanMutationResult { return { status: "success", data, message: "Saved." }; }
afterEach(() => { cleanup(); vi.restoreAllMocks(); });
beforeEach(() => { vi.resetAllMocks(); vi.mocked(mutateV2PlanExercise).mockResolvedValue(_success()); });

it("shows matching active unconfigured exercises and clears selection when searching again", () => {
  render(<PlanEditor initialData={base} />);
  const add = within(_form("Add exercise"));
  const search = add.getByRole("combobox", { name: "Exercise" });
  fireEvent.focus(search);
  expect(add.queryByRole("option", { name: /Bench press/ })).not.toBeInTheDocument();
  expect(add.queryByRole("option", { name: /Old lift/ })).not.toBeInTheDocument();
  expect(add.getByRole("button", { name: "Add to plan" })).toBeDisabled();
  fireEvent.change(search, { target: { value: " CURL " } });
  expect(add.getByRole("option", { name: /Cable curl/ })).toBeInTheDocument();
  expect(add.queryByRole("option", { name: /Squat/ })).not.toBeInTheDocument();
  fireEvent.click(add.getByRole("option", { name: /Cable curl/ }));
  expect(search).toHaveValue("Cable curl");
  expect(add.getByRole("button", { name: "Add to plan" })).toBeEnabled();
  fireEvent.change(search, { target: { value: "missing" } });
  expect(add.getByRole("button", { name: "Add to plan" })).toBeDisabled();
  expect(add.getByRole("status")).toHaveTextContent("No exercises match");
  fireEvent.submit(_form("Add exercise"));
  expect(mutateV2PlanExercise).not.toHaveBeenCalled();
});
function _chooseExercise(name: string) {
  fireEvent.focus(screen.getByRole("combobox", { name: "Exercise" }));
  fireEvent.click(screen.getByRole("option", { name: new RegExp(name) }));
}
it("saves only one exercise, preserving other drafts and entered units/increments", async () => {
  const saved = { ...base, plan: { ...base.plan, exercises: base.plan.exercises.map((exercise, i) => i ? exercise : { ...exercise, config: { ...config, targetSets: 4 } }) } };
  vi.mocked(mutateV2PlanExercise).mockResolvedValue(_success(saved));
  render(<PlanEditor initialData={base} />);
  fireEvent.change(_sets("Bench press"), { target: { value: "4" } });
  fireEvent.change(_sets("Cable row"), { target: { value: "5" } });
  fireEvent.submit(_form("Configure Bench press"));
  await screen.findByText("Saved.");
  const data = vi.mocked(mutateV2PlanExercise).mock.calls[0][0];
  expect(Object.fromEntries(data)).toMatchObject({ templateId: "plan", templateExerciseId: "bench-row", intent: "save", targetSets: "4", defaultWeightValue: "20", defaultWeightUnit: "kg", weightIncrementLbs: "5" });
  expect(_sets("Cable row")).toHaveValue(5);
  expect(within(_form("Configure Cable row")).getByRole("button", { name: "Save exercise" })).toBeEnabled();
  expect(within(_form("Configure Bench press")).getByRole("button", { name: "Save exercise" })).toBeDisabled();
});
it("serializes repeated and competing mutations while a save is pending", async () => {
  let finish!: (result: PlanMutationResult) => void;
  vi.mocked(mutateV2PlanExercise).mockReturnValue(new Promise(resolve => { finish = resolve; }));
  render(<PlanEditor initialData={base} />);
  fireEvent.change(_sets("Bench press"), { target: { value: "4" } });
  act(() => { fireEvent.submit(_form("Configure Bench press")); fireEvent.submit(_form("Configure Cable row")); });
  expect(mutateV2PlanExercise).toHaveBeenCalledOnce();
  expect(screen.getByRole("button", { name: "Remove Cable row" })).toBeDisabled();
  expect(screen.getByLabelText("Plan name")).toBeDisabled();
  expect(_sets("Cable row")).toBeDisabled();
  await act(async () => finish(_success()));
});
it("keeps drafts attached to exercise IDs after reorder", async () => {
  vi.mocked(mutateV2PlanExercise).mockResolvedValue(_success({ ...base, plan: { ...base.plan, exercises: [...base.plan.exercises].reverse() } }));
  render(<PlanEditor initialData={base} />);
  expect(screen.getByRole("button", { name: "Move Bench press up" })).toBeDisabled();
  expect(screen.getByRole("button", { name: "Move Cable row down" })).toBeDisabled();
  fireEvent.change(_sets("Bench press"), { target: { value: "7" } });
  fireEvent.click(screen.getByRole("button", { name: "Move Bench press down" }));
  await screen.findByText("Saved.");
  expect(screen.getAllByRole("heading", { level: 3 }).map(el => el.textContent)).toEqual(["Cable row", "Bench press"]);
  expect(_sets("Bench press")).toHaveValue(7);
  expect(screen.getByRole("button", { name: "Move Bench press down" })).toBeDisabled();
});
it("confirms removal and retains unrelated drafts", async () => {
  const confirm = vi.spyOn(window, "confirm").mockReturnValueOnce(false).mockReturnValueOnce(true);
  vi.mocked(mutateV2PlanExercise).mockResolvedValue(_success({ ...base, plan: { ...base.plan, exercises: [base.plan.exercises[1]] } }));
  render(<PlanEditor initialData={base} />);
  fireEvent.change(_sets("Bench press"), { target: { value: "4" } });
  fireEvent.change(_sets("Cable row"), { target: { value: "6" } });
  fireEvent.click(screen.getByRole("button", { name: "Remove Bench press" }));
  expect(confirm).toHaveBeenCalledWith(expect.stringContaining("unsaved edits will be discarded"));
  expect(mutateV2PlanExercise).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole("button", { name: "Remove Bench press" }));
  await screen.findByText("Saved.");
  expect(screen.queryByRole("heading", { name: "Bench press" })).not.toBeInTheDocument();
  expect(_sets("Cable row")).toHaveValue(6);
  fireEvent.focus(screen.getByRole("combobox", { name: "Exercise" }));
  expect(screen.getByRole("option", { name: /Bench press/ })).toBeInTheDocument();
});
it("adds with chosen settings and removes the persisted exercise from the picker", async () => {
  const added = { ...base.plan.exercises[0], id: "squat-row", exerciseId: "squat", exerciseName: "Squat", position: 3 };
  vi.mocked(mutateV2PlanExercise).mockResolvedValue(_success({ ...base, plan: { ...base.plan, exercises: [...base.plan.exercises, added] } }));
  render(<PlanEditor initialData={base} />);
  const add = within(_form("Add exercise"));
  _chooseExercise("Squat");
  fireEvent.change(add.getByLabelText("Weight unit"), { target: { value: "kg" } });
  fireEvent.change(add.getByLabelText("Starting weight"), { target: { value: "20" } });
  fireEvent.submit(_form("Add exercise"));
  await screen.findByText("Saved.");
  expect(Object.fromEntries(vi.mocked(mutateV2PlanExercise).mock.calls[0][0])).toMatchObject({ intent: "add", exerciseId: "squat", defaultWeightValue: "20", defaultWeightUnit: "kg", weightIncrementLbs: "5" });
  expect(screen.getByRole("heading", { name: "Squat" })).toBeInTheDocument();
  fireEvent.focus(add.getByRole("combobox", { name: "Exercise" }));
  expect(add.queryByRole("option", { name: /Squat/ })).not.toBeInTheDocument();
  expect(add.getByLabelText("Starting weight")).toHaveValue(0);
  expect(add.getByLabelText("Exercise")).toHaveValue("");
});
it("retains invalid and blank values after failed saves and supports discard", async () => {
  vi.mocked(mutateV2PlanExercise).mockResolvedValue({ status: "error", data: base, message: "Fill in every exercise setting." });
  render(<PlanEditor initialData={base} />);
  fireEvent.change(_sets("Bench press"), { target: { value: "" } });
  fireEvent.submit(_form("Configure Bench press"));
  expect(await screen.findByRole("alert")).toHaveTextContent("Fill in every");
  expect(_sets("Bench press")).toHaveValue(null);
  fireEvent.click(within(_form("Configure Bench press")).getByRole("button", { name: "Discard edits" }));
  expect(_sets("Bench press")).toHaveValue(3);
});
it("locks after failed recovery, keeps drafts, and reloads before allowing retry", async () => {
  vi.mocked(mutateV2PlanExercise).mockRejectedValue(new Error("network"));
  vi.mocked(reloadV2Plan).mockRejectedValueOnce(new Error("offline")).mockResolvedValueOnce(base);
  render(<PlanEditor initialData={base} />);
  fireEvent.change(_sets("Bench press"), { target: { value: "6" } });
  fireEvent.submit(_form("Configure Bench press"));
  const check = await screen.findByRole("button", { name: "Check saved plan" });
  expect(_sets("Bench press")).toHaveValue(6);
  expect(_sets("Bench press")).toBeDisabled();
  expect(screen.getByRole("button", { name: "Move Cable row up" })).toBeDisabled();
  fireEvent.click(check);
  await waitFor(() => expect(_sets("Bench press")).toBeEnabled());
  expect(_sets("Bench press")).toHaveValue(6);
  expect(reloadV2Plan).toHaveBeenCalledTimes(2);
});
it("recovers an uncertain add without offering to add it again", async () => {
  vi.mocked(mutateV2PlanExercise).mockRejectedValue(new Error("lost response"));
  vi.mocked(reloadV2Plan).mockResolvedValue({ ...base, plan: { ...base.plan, exercises: [...base.plan.exercises, { ...base.plan.exercises[0], id: "squat-row", exerciseId: "squat", exerciseName: "Squat" }] } });
  render(<PlanEditor initialData={base} />);
  _chooseExercise("Squat");
  fireEvent.submit(_form("Add exercise"));
  await screen.findByRole("heading", { name: "Squat" });
  fireEvent.focus(screen.getByRole("combobox", { name: "Exercise" }));
  expect(within(_form("Add exercise")).queryByRole("option", { name: /Squat/ })).not.toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Add to plan" })).toBeDisabled();
  expect(mutateV2PlanExercise).toHaveBeenCalledOnce();
});
it("uses one leave warning for name and exercise drafts and retains them through name refresh", async () => {
  const confirm = vi.spyOn(window, "confirm").mockReturnValue(false);
  vi.mocked(renameV2Plan).mockResolvedValue({ status: "success", plan: { id: "plan", name: "Renamed" } });
  const { rerender } = render(<><PlanEditor initialData={base} /><a href="/v2/library">Library</a></>);
  fireEvent.change(screen.getByLabelText("Plan name"), { target: { value: "Renamed" } });
  fireEvent.change(_sets("Bench press"), { target: { value: "5" } });
  fireEvent.click(screen.getByRole("link", { name: "Library" }));
  expect(confirm).toHaveBeenCalledOnce();
  fireEvent.submit(_form("Rename plan"));
  await screen.findByText("Plan name saved.");
  rerender(<><PlanEditor initialData={{ ...base, plan: { ...base.plan, name: "Renamed" } }} /><a href="/v2/library">Library</a></>);
  expect(_sets("Bench press")).toHaveValue(5);
});
it("handles an empty plan and an exhausted exercise catalog", () => {
  render(<PlanEditor initialData={{ plan: { ...base.plan, exercises: [] }, availableExercises: [] }} />);
  expect(screen.getByText(/No exercises yet/)).toBeInTheDocument();
  expect(screen.getByText(/no active exercises/)).toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "Add to plan" })).not.toBeInTheDocument();
});

it("keeps the editor mounted without refreshing when server recovery is unavailable", async () => {
  vi.mocked(mutateV2PlanExercise).mockResolvedValue({ status: "error", data: null, message: "Save could not be confirmed." });
  render(<PlanEditor initialData={base} />);
  fireEvent.change(_sets("Bench press"), { target: { value: "4" } });
  fireEvent.submit(_form("Configure Bench press"));
  await screen.findByRole("button", { name: "Check saved plan" });
  expect(_sets("Bench press")).toHaveValue(4);
  expect(_sets("Bench press")).toBeDisabled();
  expect(router.refresh).not.toHaveBeenCalled();
});
it("blocks exercise submissions while a name save is in flight", async () => {
  let finish!: (result: Awaited<ReturnType<typeof renameV2Plan>>) => void;
  vi.mocked(renameV2Plan).mockReturnValue(new Promise(resolve => { finish = resolve; }));
  render(<PlanEditor initialData={base} />);
  fireEvent.change(screen.getByLabelText("Plan name"), { target: { value: "Renamed" } });
  act(() => { fireEvent.submit(_form("Rename plan")); fireEvent.submit(_form("Configure Bench press")); });
  expect(mutateV2PlanExercise).not.toHaveBeenCalled();
  expect(screen.getByRole("button", { name: "Move Cable row up" })).toBeDisabled();
  await act(async () => finish({ status: "success", plan: { id: "plan", name: "Renamed" } }));
  expect(screen.getByRole("button", { name: "Move Cable row up" })).toBeEnabled();
});
