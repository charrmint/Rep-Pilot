"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Button } from "../ui/primitives";
import type { ExercisePickerProps } from "./types";

export function ExercisePicker({ exercises, selectedId, query, disabled, onQueryChange, onSelect }: ExercisePickerProps) {
  const id = useId();
  const input = useRef<HTMLInputElement>(null);
  const list = useRef<HTMLUListElement>(null);
  const [open, setOpen] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const selected = exercises.find((exercise) => exercise.id === selectedId);
  const matches = exercises.filter((exercise) => selected || exercise.name.toLowerCase().includes(query.trim().toLowerCase()));
  const expanded = open && !disabled;
  const activeIndex = matches.findIndex((exercise) => exercise.id === activeId);

  useEffect(() => {
    if (expanded && activeIndex >= 0) {
      list.current?.children[activeIndex]?.scrollIntoView?.({ block: "nearest" });
    }
  }, [expanded, activeIndex]);

  function _choose(index: number) {
    if (disabled || !matches[index]) return;
    onSelect(matches[index]);
    setOpen(false);
    setActiveId(null);
  }

  return (
    <div className="v2-exercise-picker" onBlur={(event) => {
      if (!event.currentTarget.contains(event.relatedTarget)) {
        setOpen(false);
        setActiveId(null);
      }
    }}>
      <label className="v2-field" htmlFor={id}>Exercise</label>
      <div className="v2-picker-input">
        <input ref={input} id={id} className="v2-input" role="combobox"
          aria-autocomplete="list" aria-expanded={expanded}
          aria-controls={expanded ? `${id}-results` : undefined}
          aria-activedescendant={expanded && activeIndex >= 0 ? `${id}-option-${activeIndex}` : undefined}
          aria-describedby={`${id}-help`} autoComplete="off" disabled={disabled}
          placeholder="Search exercises…" value={query}
          onFocus={() => setOpen(true)} onClick={() => setOpen(true)}
          onChange={(event) => { onQueryChange(event.target.value); setActiveId(null); setOpen(true); }}
          onKeyDown={(event) => {
            if (event.nativeEvent.isComposing) return;
            if (event.key === "ArrowDown" || event.key === "ArrowUp") {
              event.preventDefault();
              setOpen(true);
              const next = !expanded || activeIndex < 0
                ? event.key === "ArrowDown" ? 0 : matches.length - 1
                : Math.max(0, Math.min(matches.length - 1, activeIndex + (event.key === "ArrowDown" ? 1 : -1)));
              setActiveId(matches[next]?.id ?? null);
            } else if (event.key === "Enter") {
              event.preventDefault();
              if (expanded && activeIndex >= 0) _choose(activeIndex);
            } else if (event.key === "Escape") {
              event.preventDefault();
              setOpen(false);
              setActiveId(null);
            }
          }} />
        {query && <Button variant="quiet" disabled={disabled} aria-label="Clear exercise selection and search"
          onClick={() => { onQueryChange(""); setActiveId(null); input.current?.focus(); setOpen(true); }}>Clear</Button>}
      </div>
      <input type="hidden" name="exerciseId" value={selected?.id ?? ""} />
      <p className="v2-picker-status v2-muted" role="status">
        {selected ? `Selected: ${selected.name}.` : expanded
          ? matches.length ? `${matches.length} ${matches.length === 1 ? "exercise" : "exercises"} available.`
            : "No exercises match. Try another name or clear your search."
          : "Choose an exercise before adding it to your plan."}
      </p>
      {expanded && <ul ref={list} id={`${id}-results`} role="listbox" aria-label="Available exercises" className="v2-picker-results">
        {matches.map((exercise, index) => (
          <li key={exercise.id} id={`${id}-option-${index}`} role="option"
            aria-selected={exercise.id === selectedId} data-active={index === activeIndex}
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => { _choose(index); input.current?.focus(); setOpen(false); }}>
            <span>{exercise.name}</span>
            <span className="v2-muted">{exercise.id === selectedId ? "Selected · " : ""}{exercise.isSystemExercise ? "Built-in" : "Custom"}</span>
          </li>
        ))}
      </ul>}
    </div>
  );
}
