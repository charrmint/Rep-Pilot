"use client";

import { poundsToKilograms } from "@/lib/units/weight";
import { useEffect, useId, useRef } from "react";
import { Button, Card } from "../ui/primitives";
import type { SetEditorProps } from "./types";

export function SetEditor({
  exercise,
  position,
  draft,
  editing,
  disabled,
  onChange,
  onSave,
  onCancel,
  onDelete,
  onConfirmDelete,
  onCancelDelete,
  confirmingDelete = false,
}: SetEditorProps) {
  const id = useId();
  const deleteSection = useRef<HTMLDivElement>(null);
  const wasConfirming = useRef(false);
  useEffect(() => {
    if (confirmingDelete || wasConfirming.current) {
      deleteSection.current?.querySelector<HTMLButtonElement>(confirmingDelete ? ".v2-keep-set" : ".v2-danger-action")?.focus();
    }
    wasConfirming.current = confirmingDelete;
  }, [confirmingDelete]);
  const increment =
    draft.unit === "kg"
      ? poundsToKilograms(exercise.weightIncrementLbs)
      : exercise.weightIncrementLbs;
  function _step(direction: number) {
    onChange({
      ...draft,
      weight: String(
        Number(
          Math.max(
            0,
            Number(draft.weight || 0) + direction * increment,
          ).toFixed(2),
        ),
      ),
      dirty: true,
    });
  }
  function _stepReps(direction: number) {
    onChange({ ...draft, reps: String(Math.max(0, Math.trunc(Number(draft.reps || 0)) + direction)), dirty: true });
  }
  return (
    <Card className="v2-set-editor">
      <form
        onSubmit={(event) => {
          event.preventDefault();
          onSave();
        }}
      >
        <div className="v2-section-heading">
          <h2 tabIndex={-1} className="v2-set-editor-heading">
            {editing ? "Edit" : "Log"} set {position}
          </h2>
          <span className="v2-muted">
            {draft.dirty
              ? "Unsaved changes"
              : editing
                ? "Saved set"
                : "Next set"}
          </span>
        </div>
        <fieldset disabled={disabled} className="v2-editor-fields">
          <div className="v2-stepper-field">
            <label htmlFor={`${id}-weight`}>Weight ({draft.unit})</label>
            <div className="v2-inline-stepper">
              <Button variant="quiet" aria-label={`Decrease weight by ${Number(increment.toFixed(2))} ${draft.unit}`} onClick={() => _step(-1)}>−</Button>
              <input id={`${id}-weight`} type="number" min="0" step="any" required inputMode="decimal"
                value={draft.weight} onChange={(event) => onChange({ ...draft, weight: event.target.value, dirty: true })} />
              <Button variant="quiet" aria-label={`Increase weight by ${Number(increment.toFixed(2))} ${draft.unit}`} onClick={() => _step(1)}>+</Button>
            </div>
          </div>
          <div className="v2-stepper-field">
            <label htmlFor={`${id}-reps`}>Reps</label>
            <div className="v2-inline-stepper">
              <Button variant="quiet" aria-label="Decrease reps by 1" onClick={() => _stepReps(-1)}>−</Button>
              <input id={`${id}-reps`} type="number" min="0" step="1" required inputMode="numeric"
                value={draft.reps} onChange={(event) => onChange({ ...draft, reps: event.target.value, dirty: true })} />
              <Button variant="quiet" aria-label="Increase reps by 1" onClick={() => _stepReps(1)}>+</Button>
            </div>
          </div>
          <fieldset className="v2-rir-field">
            <legend>Reps left</legend>
            <p className="v2-muted">How many more clean reps could you do?</p>
            <div className="v2-rir-options">
              {[0, 1, 2, 3, null].map((value) => (
                <Button
                  key={value ?? "skip"}
                  variant="secondary"
                  aria-pressed={
                    value === 3
                      ? draft.rir !== null && draft.rir >= 3
                      : draft.rir === value
                  }
                  onClick={() =>
                    onChange({ ...draft, rir: value, dirty: true })
                  }
                >
                  {value === null ? "Skip" : value === 3 ? "3+" : value}
                </Button>
              ))}
            </div>
          </fieldset>
        </fieldset>
        <div className="v2-actions">
          <Button
            type="submit"
            disabled={
              disabled || draft.weight.trim() === "" || draft.reps.trim() === ""
            }
          >
            {disabled ? "Please wait…" : editing ? "Update set" : "Log set"}
          </Button>
          {editing && (
            <Button variant="quiet" disabled={disabled} onClick={onCancel}>
              Discard edits
            </Button>
          )}
        </div>
      </form>
      {editing && onDelete && (
        <div ref={deleteSection} className="v2-set-delete">
          {confirmingDelete ? (
            <div className="v2-delete-confirm" role="group" aria-label={`Delete set ${position}?`}>
              <p>Delete set {position}? This also discards any unsaved edits to this set.</p>
              <div className="v2-actions">
                <Button variant="secondary" disabled={disabled} onClick={onConfirmDelete}>Confirm delete</Button>
                <Button variant="quiet" className="v2-keep-set" disabled={disabled} onClick={onCancelDelete}>Keep set</Button>
              </div>
            </div>
          ) : (
            <Button variant="quiet" className="v2-danger-action" disabled={disabled} onClick={onDelete}>Delete set {position}</Button>
          )}
        </div>
      )}
    </Card>
  );
}
