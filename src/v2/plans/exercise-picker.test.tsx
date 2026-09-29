import { useState } from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { ExercisePicker } from "./exercise-picker";

const exercises = [
  { id: "squat", name: "Squat", isArchived: false, isSystemExercise: true },
  { id: "curl", name: "Cable curl", isArchived: false, isSystemExercise: false },
];
function Harness({ disabled = false, submit = () => {} }: { disabled?: boolean; submit?: () => void }) {
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState("");
  return <form onSubmit={(event) => { event.preventDefault(); submit(); }}>
    <ExercisePicker exercises={exercises} query={query} selectedId={selectedId} disabled={disabled}
      onQueryChange={(value) => { setQuery(value); setSelectedId(""); }}
      onSelect={(exercise) => { setQuery(exercise.name); setSelectedId(exercise.id); }} />
    <button type="submit">Add</button>
  </form>;
}
afterEach(cleanup);
it("navigates and selects with arrows and Enter without submitting the form", () => {
  const submit = vi.fn();
  render(<Harness submit={submit} />);
  const input = screen.getByRole("combobox");
  fireEvent.focus(input);
  expect(input).toHaveAttribute("aria-expanded", "true");
  fireEvent.keyDown(input, { key: "ArrowDown" });
  expect(document.getElementById(input.getAttribute("aria-activedescendant")!)).toHaveTextContent("Squat");
  fireEvent.keyDown(input, { key: "ArrowDown" });
  expect(document.getElementById(input.getAttribute("aria-activedescendant")!)).toHaveTextContent("Cable curl");
  fireEvent.keyDown(input, { key: "ArrowUp" });
  fireEvent.keyDown(input, { key: "Enter" });
  expect(input).toHaveValue("Squat");
  expect(input).toHaveAttribute("aria-expanded", "false");
  expect(screen.getByRole("status")).toHaveTextContent("Selected: Squat");
  expect(submit).not.toHaveBeenCalled();
  fireEvent.click(input);
  expect(screen.getByRole("option", { name: /Squat/ })).toHaveAttribute("aria-selected", "true");
  fireEvent.keyDown(input, { key: "Escape" });
  expect(input).toHaveValue("Squat");
  expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
});
it("clears selection, exposes no-match recovery, and closes when focus leaves", () => {
  render(<Harness />);
  const input = screen.getByRole("combobox");
  fireEvent.change(input, { target: { value: "curl" } });
  fireEvent.click(screen.getByRole("option", { name: /Cable curl/ }));
  fireEvent.click(screen.getByRole("button", { name: "Clear exercise selection and search" }));
  expect(input).toHaveFocus();
  expect(input).toHaveValue("");
  expect(screen.getAllByRole("option")).toHaveLength(2);
  fireEvent.change(input, { target: { value: "missing" } });
  fireEvent.keyDown(input, { key: "ArrowDown" });
  fireEvent.keyDown(input, { key: "Enter" });
  expect(input).not.toHaveAttribute("aria-activedescendant");
  expect(screen.getByRole("status")).toHaveTextContent("Try another name or clear your search");
  fireEvent.blur(input, { relatedTarget: screen.getByRole("button", { name: "Add" }) });
  expect(input).toHaveAttribute("aria-expanded", "false");
});
it("hides results and disables controls while mutations are blocked", () => {
  const { rerender } = render(<Harness />);
  fireEvent.change(screen.getByRole("combobox"), { target: { value: "squat" } });
  rerender(<Harness disabled />);
  expect(screen.queryByRole("option")).not.toBeInTheDocument();
  expect(screen.getByRole("combobox")).toBeDisabled();
  expect(screen.getByRole("button", { name: "Clear exercise selection and search" })).toBeDisabled();
});
