"use client";

import { poundsToKilograms } from "@/lib/units/weight";
import { Button, Card, Input } from "../ui/primitives";
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
}: SetEditorProps) {
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
  return (
    <Card className="v2-set-editor">
      <form
        onSubmit={(event) => {
          event.preventDefault();
          onSave();
        }}
      >
        <div className="v2-section-heading">
          <h2>
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
          <div className="v2-weight-field">
            <Input
              label={`Weight (${draft.unit})`}
              type="number"
              min="0"
              step="any"
              required
              inputMode="decimal"
              value={draft.weight}
              onChange={(event) =>
                onChange({ ...draft, weight: event.target.value, dirty: true })
              }
            />
            <div className="v2-step-buttons">
              <Button
                variant="secondary"
                aria-label={`Decrease weight by ${Number(increment.toFixed(2))} ${draft.unit}`}
                onClick={() => _step(-1)}
              >
                −
              </Button>
              <Button
                variant="secondary"
                aria-label={`Increase weight by ${Number(increment.toFixed(2))} ${draft.unit}`}
                onClick={() => _step(1)}
              >
                +
              </Button>
            </div>
          </div>
          <Input
            label="Reps"
            type="number"
            min="0"
            step="1"
            required
            inputMode="numeric"
            placeholder={`${exercise.minReps}–${exercise.maxReps} target`}
            value={draft.reps}
            onChange={(event) =>
              onChange({ ...draft, reps: event.target.value, dirty: true })
            }
          />
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
    </Card>
  );
}
