import Link from "next/link";
import { ButtonLink, Card } from "../ui/primitives";
import { Icon } from "../ui/icon";
import { RetryButton } from "../ui/retry-button";
import { StartWorkout } from "../workouts/start-workout";
import { selectQuickStartPlans } from "./plans";
import type { NextWorkoutProps, TodayPlansProps } from "./types";

export async function NextWorkout({ plans }: NextWorkoutProps) {
  const result = await plans;
  if (result.status === "unavailable") {
    return (
      <Card className="v2-hero">
        <span className="v2-chip">Your next session</span>
        <h2>Your plans couldn’t load.</h2>
        <p>Try loading your plans again to choose your next workout.</p>
        <RetryButton />
      </Card>
    );
  }
  const { library } = result;
  const ready = selectQuickStartPlans(library).length > 0;
  const hasActive = library.activeTemplates.length > 0;
  const hasArchived = library.archivedTemplates.length > 0;
  return (
    <Card className="v2-hero">
      <span className="v2-chip">Your next session</span>
      <h2>
        {ready
          ? "Make time for your next set."
          : hasActive
            ? "Your plan needs exercises."
            : hasArchived
              ? "Bring a plan back into your routine."
              : "Start with your first plan."}
      </h2>
      <p>
        {ready
          ? "Choose a plan below, or explore your library."
          : hasActive
            ? "Open your library and edit a plan to add exercises before starting."
            : hasArchived
              ? "Your plans are archived. Create a new one or manage your archived plans in the library."
              : "Create a plan and add exercises to get ready for your first workout."}
      </p>
      <div className="v2-actions">
        <ButtonLink href={ready || hasActive ? "/v2/library" : "/templates"}>
          {ready ? "Choose a workout" : hasActive ? "Set up a plan" : "Create a plan"}
          <Icon name="arrow" />
        </ButtonLink>
        {!ready && !hasActive && hasArchived && (
          <ButtonLink href="/v2/library" variant="secondary">
            Open library
          </ButtonLink>
        )}
      </div>
      {!ready && (
        <p className="v2-classic-note">
          Plan creation and editing open in the classic app.
        </p>
      )}
    </Card>
  );
}

export async function TodayPlans({
  plans,
  activeWorkout,
  activeWorkoutUnavailable,
}: TodayPlansProps) {
  const result = await plans;
  if (result.status === "unavailable") {
    return (
      <Card>
        <h3>Quick start is unavailable.</h3>
        <p className="v2-muted" role="alert">
          We couldn’t load your plans. Your saved workouts are unchanged.
        </p>
        <RetryButton />
      </Card>
    );
  }
  const selected = selectQuickStartPlans(result.library);
  if (selected.length === 0) {
    const hasActive = result.library.activeTemplates.length > 0;
    const hasArchived = result.library.archivedTemplates.length > 0;
    return (
      <Card className="v2-empty">
        <h3>
          {hasActive
            ? "Add exercises to get started."
            : hasArchived ? "No active plans yet." : "No plans yet."}
        </h3>
        <p>
          {hasActive
            ? "Finish setting up a plan in your library."
            : hasArchived
              ? "Find your archived plans in the library, or create a new plan."
              : "Create your first plan in the classic app. It will appear here when it has exercises."}
        </p>
        <ButtonLink
          href={hasActive || hasArchived ? "/v2/library" : "/templates"}
          variant="secondary"
        >
          {hasActive || hasArchived ? "Open library" : "Create a plan"}
        </ButtonLink>
      </Card>
    );
  }
  return (
    <>
      <p className="v2-muted v2-quick-start-note">
        Your most recently updated plans with exercises.
      </p>
      {activeWorkoutUnavailable && (
        <p role="alert" className="v2-error">
          Check your active workout before starting another session.
        </p>
      )}
      <ul className="v2-quick-start-list">
        {selected.map((plan) => {
          const sets = plan.exercises.reduce(
            (total, exercise) => total + exercise.config.targetSets,
            0,
          );
          return (
            <li key={plan.id}>
              <article
                className="v2-card v2-quick-start-plan"
                aria-labelledby={`quick-start-${plan.id}`}
              >
                <div className="v2-quick-start-heading">
                  <span className="v2-tile-icon">
                    <Icon name="dumbbell" />
                  </span>
                  <div>
                    <h3 id={`quick-start-${plan.id}`}>{plan.name}</h3>
                    <p className="v2-muted">
                      {plan.exercises.length}{" "}
                      {plan.exercises.length === 1 ? "exercise" : "exercises"}
                      {" · "}{sets} planned {sets === 1 ? "set" : "sets"}
                    </p>
                  </div>
                </div>
                <StartWorkout
                  templateId={plan.id}
                  hasExercises
                  activeWorkout={activeWorkout}
                  activeWorkoutUnavailable={activeWorkoutUnavailable}
                />
              </article>
            </li>
          );
        })}
      </ul>
    </>
  );
}

export function TodayPlansHeading() {
  return (
    <div className="v2-section-heading">
      <div>
        <p className="v2-eyebrow">Plans</p>
        <h2 id="quick-start-heading">Quick start</h2>
      </div>
      <Link className="v2-text-link" href="/v2/library">
        See all <Icon name="arrow" />
      </Link>
    </div>
  );
}
