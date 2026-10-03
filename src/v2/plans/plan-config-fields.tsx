import { Input } from "../ui/primitives";
import type { PlanConfigFieldsProps, PlanExerciseDraft } from "./types";

export function PlanConfigFields({ prefix, draft, onChange }: PlanConfigFieldsProps) {
  function _number(label: string, name: keyof PlanExerciseDraft, min: number, step: number) {
    return (
      <Input id={`${prefix}-${name}`} label={label} name={name} type="number"
        required min={min} step={step} value={draft[name]}
        onChange={(event) => onChange({ ...draft, [name]: event.target.value })} />
    );
  }
  return (
    <div className="v2-plan-config">
      <div className="v2-plan-config-reps">
        {_number("Sets", "targetSets", 1, 1)}
        {_number("Min reps", "minReps", 1, 1)}
        {_number("Max reps", "maxReps", 1, 1)}
      </div>
      <div className="v2-plan-config-weight">
        {_number("Starting weight", "defaultWeightValue", 0, 0.01)}
        <label className="v2-field" htmlFor={`${prefix}-unit`}>
          <span>Weight unit</span>
          <select id={`${prefix}-unit`} name="defaultWeightUnit" className="v2-input"
            value={draft.defaultWeightUnit}
            onChange={(event) => onChange({ ...draft, defaultWeightUnit: event.target.value })}>
            <option value="lb">lb</option><option value="kg">kg</option>
          </select>
        </label>
      </div>
      <div className="v2-plan-config-increment">
        {_number("Increment (lb)", "weightIncrementLbs", 0.01, 0.01)}
      </div>
      <p className="v2-muted v2-plan-config-help">Changing units keeps the number you entered. Increments are always in pounds, including for kg exercises.</p>
    </div>
  );
}
