"use client";

import { useState } from "react";
import { Button } from "../ui/primitives";
import { SearchPicker } from "../ui/search-picker";
import type { PlanAssignmentProps } from "./types";

export function PlanAssignment({ exerciseId, exerciseName, plans, disabled, onAssign }: PlanAssignmentProps) {
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState("");
  const selected = plans.find(plan => plan.id === selectedId);
  return <form className="v2-plan-name-form" aria-label={`Add ${exerciseName} to plan`} onSubmit={event => {
    event.preventDefault();
    if (disabled || !selected) return;
    const form = new FormData(event.currentTarget);
    form.set("intent", "assign");
    form.set("exerciseId", exerciseId);
    onAssign(form);
  }}>
    <SearchPicker options={plans} label={`Plan for ${exerciseName}`} itemLabel="plan" fieldName="templateId"
      selectedId={selected?.id ?? ""} query={query} disabled={disabled}
      onQueryChange={value => { setQuery(value); setSelectedId(""); }}
      onSelect={plan => { setQuery(plan.name); setSelectedId(plan.id); }} />
    <p className="v2-muted">Starts at 3 sets of 8–12 reps with 0 lb. Adjust the prescription in the plan editor.</p>
    <Button type="submit" disabled={disabled || !selected}>Add exercise</Button>
  </form>;
}
