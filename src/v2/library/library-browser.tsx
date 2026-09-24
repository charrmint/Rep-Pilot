"use client";

import Link from "next/link";
import { useState } from "react";
import type { LibraryBrowserProps } from "../types";
import { Button, ButtonLink, Card, Input } from "../ui/primitives";
import { Icon } from "../ui/icon";

export function LibraryBrowser({
  view,
  plans,
  exercises,
}: LibraryBrowserProps) {
  const [query, setQuery] = useState("");
  const [archived, setArchived] = useState(false);
  const normalizedQuery = query.trim().toLowerCase();
  const visiblePlans =
    (archived ? plans?.archivedTemplates : plans?.activeTemplates)?.filter(
      (plan) => plan.name.toLowerCase().includes(normalizedQuery),
    ) ?? [];
  const visibleExercises =
    (archived
      ? exercises?.archivedCustomExercises
      : exercises?.activeExercises
    )?.filter((exercise) =>
      exercise.name.toLowerCase().includes(normalizedQuery),
    ) ?? [];
  const count =
    view === "plans" ? visiblePlans.length : visibleExercises.length;

  return (
    <>
      <div className="v2-library-tools">
        <Input
          label={`Search ${view}`}
          id={`v2-search-${view}`}
          type="search"
          placeholder={
            view === "plans" ? "Find a training plan…" : "Find an exercise…"
          }
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
        <div className="v2-filter" role="group" aria-label="Archive filter">
          <Button
            variant="quiet"
            aria-pressed={!archived}
            onClick={() => setArchived(false)}
          >
            Active
          </Button>
          <Button
            variant="quiet"
            aria-pressed={archived}
            onClick={() => setArchived(true)}
          >
            Archived
          </Button>
        </div>
      </div>
      <div className="v2-section-heading">
        <h2>
          {archived ? "Archived" : "Your"}{" "}
          {view === "plans" ? "plans" : "exercises"}
        </h2>
        <span className="v2-muted" role="status">
          {count} {count === 1 ? "result" : "results"}
        </span>
      </div>
      {count === 0 ? (
        <Card className="v2-empty">
          <span className="v2-tile-icon">
            <Icon name={view === "plans" ? "library" : "search"} />
          </span>
          <h2>
            {normalizedQuery
              ? "No matches found"
              : `No ${archived ? "archived " : ""}${view} yet`}
          </h2>
          <p>
            {normalizedQuery
              ? "Try another name or clear your search."
              : archived
                ? "Items you archive will appear here."
                : view === "plans"
                  ? "Create a plan to give your next workout a starting point."
                  : "Add an exercise to start building your library."}
          </p>
          {normalizedQuery ? (
            <Button variant="secondary" onClick={() => setQuery("")}>
              Clear search
            </Button>
          ) : (
            !archived && (
              <ButtonLink href={view === "plans" ? "/templates" : "/exercises"}>
                Create {view === "plans" ? "a plan" : "an exercise"}
              </ButtonLink>
            )
          )}
        </Card>
      ) : view === "plans" ? (
        <ul className="v2-plan-grid">
          {visiblePlans.map((plan) => (
            <li key={plan.id}>
              <Card className="v2-plan-card">
                <div className="v2-card-top">
                  <span className="v2-tile-icon">
                    <Icon name="dumbbell" />
                  </span>
                  <span className="v2-chip">
                    {archived
                      ? "Archived"
                      : `${plan.exercises.reduce((sum, exercise) => sum + exercise.config.targetSets, 0)} sets`}
                  </span>
                </div>
                <h3>{plan.name}</h3>
                <p className="v2-muted">
                  {plan.exercises.length}{" "}
                  {plan.exercises.length === 1 ? "exercise" : "exercises"}
                </p>
                <details className="v2-plan-details">
                  <summary>View exercises</summary>
                  {plan.exercises.length ? (
                    <ol>
                      {plan.exercises.map((exercise) => (
                        <li key={exercise.id}>
                          <span>{exercise.exerciseName}</span>
                          <span>
                            {exercise.config.targetSets} ×{" "}
                            {exercise.config.minReps}–{exercise.config.maxReps}
                          </span>
                        </li>
                      ))}
                    </ol>
                  ) : (
                    <p className="v2-muted">
                      Add exercises to prepare this plan.
                    </p>
                  )}
                </details>
                <div className="v2-card-actions">
                  <ButtonLink
                    variant="secondary"
                    href={
                      archived ? "/templates" : `/templates/${plan.id}/edit`
                    }
                  >
                    {archived ? "Manage plan" : "Edit plan"}
                    <Icon name="arrow" />
                  </ButtonLink>
                  <Link
                    className="v2-text-link"
                    href={`/workouts/templates/${plan.id}`}
                  >
                    History
                  </Link>
                </div>
              </Card>
            </li>
          ))}
        </ul>
      ) : (
        <ul className="v2-exercise-list">
          {visibleExercises.map((exercise) => (
            <li key={exercise.id}>
              <span className="v2-tile-icon">
                <Icon name="dumbbell" />
              </span>
              <div className="v2-exercise-name">
                <h3>{exercise.name}</h3>
                <p className="v2-muted">
                  {exercise.isSystemExercise
                    ? "Built-in exercise"
                    : "Custom exercise"}
                  {archived ? " · Archived" : ""}
                </p>
              </div>
              <Link
                className="v2-text-link"
                href={`/workouts/exercises/${exercise.id}`}
                aria-label={`View history for ${exercise.name}`}
              >
                History <Icon name="arrow" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
