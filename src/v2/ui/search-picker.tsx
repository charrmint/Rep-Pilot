"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Button } from "./primitives";
import type { SearchPickerOption, SearchPickerProps } from "./types";

export function SearchPicker<T extends SearchPickerOption>({ options, label, itemLabel, fieldName, describeOption, selectedId, query, disabled, onQueryChange, onSelect }: SearchPickerProps<T>) {
  const id = useId();
  const input = useRef<HTMLInputElement>(null);
  const list = useRef<HTMLUListElement>(null);
  const [open, setOpen] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const selected = options.find((exercise) => exercise.id === selectedId);
  const matches = options.filter((exercise) => selected || exercise.name.toLowerCase().includes(query.trim().toLowerCase()));
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
    <div className="v2-search-picker" onBlur={(event) => {
      if (!event.currentTarget.contains(event.relatedTarget)) {
        setOpen(false);
        setActiveId(null);
      }
    }}>
      <label className="v2-field" htmlFor={id}>{label}</label>
      <div className="v2-picker-input">
        <input ref={input} id={id} className="v2-input" role="combobox"
          aria-autocomplete="list" aria-expanded={expanded}
          aria-controls={expanded ? `${id}-results` : undefined}
          aria-activedescendant={expanded && activeIndex >= 0 ? `${id}-option-${activeIndex}` : undefined}
          aria-describedby={`${id}-help`} autoComplete="off" disabled={disabled}
          placeholder={`Search ${itemLabel}s…`} value={query}
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
        {query && <Button variant="quiet" disabled={disabled} aria-label={`Clear ${itemLabel} selection and search`}
          onClick={() => { onQueryChange(""); setActiveId(null); input.current?.focus(); setOpen(true); }}>Clear</Button>}
      </div>
      <input type="hidden" name={fieldName} value={selected?.id ?? ""} />
      <p id={`${id}-help`} className="v2-picker-status v2-muted" role="status">
        {selected ? `Selected: ${selected.name}.` : expanded
          ? matches.length ? `${matches.length} ${itemLabel}${matches.length === 1 ? "" : "s"} available.`
            : `No ${itemLabel}s match. Try another name or clear your search.`
          : `Choose ${itemLabel === "exercise" ? "an" : "a"} ${itemLabel} before adding.`}
      </p>
      {expanded && <ul ref={list} id={`${id}-results`} role="listbox" aria-label={`Available ${itemLabel}s`} className="v2-picker-results">
        {matches.map((exercise, index) => (
          <li key={exercise.id} id={`${id}-option-${index}`} role="option"
            aria-selected={exercise.id === selectedId} data-active={index === activeIndex}
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => { _choose(index); input.current?.focus(); setOpen(false); }}>
            <span>{exercise.name}</span>
            <span className="v2-muted">{exercise.id === selectedId ? "Selected · " : ""}{describeOption?.(exercise)}</span>
          </li>
        ))}
      </ul>}
    </div>
  );
}
