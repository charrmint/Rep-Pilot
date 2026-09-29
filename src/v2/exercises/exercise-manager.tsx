"use client";

import { useRef, useState } from "react";
import { unstable_rethrow, useRouter } from "next/navigation";
import { LibraryBrowser } from "../library/library-browser";
import { Button, ButtonLink, Card, Input } from "../ui/primitives";
import { useLeaveWarning } from "../workouts/use-leave-warning";
import { PlanAssignment } from "./plan-assignment";
import { mutateV2Exercise } from "./actions";
import type { ExerciseManagerData, ExerciseMutationResult } from "./types";

export function ExerciseManager({ initialData }: { initialData: ExerciseManagerData }) {
  const router = useRouter();
  const [data, setData] = useState(initialData);
  const [name, setName] = useState("");
  const [pending, setPending] = useState(false);
  const [unavailable, setUnavailable] = useState(false);
  const [feedback, setFeedback] = useState<ExerciseMutationResult | null>(null);
  const [feedbackTarget, setFeedbackTarget] = useState("create");
  const [assignedPlan, setAssignedPlan] = useState<string | null>(null);
  const lock = useRef(false);
  useLeaveWarning(Boolean(name.trim()), pending, "Leave this library? Your unsaved exercise name will be lost.");

  async function _mutate(form: FormData, target: string) {
    const intent = form.get("intent");
    if (lock.current || (unavailable && intent !== "refresh")) return;
    if (intent === "archive" && !window.confirm("Archive this exercise? It will be hidden from exercise pickers. Existing plans and workout history stay intact.")) return;
    lock.current = true;
    setPending(true);
    setFeedback(null);
    setFeedbackTarget(target);
    setAssignedPlan(null);
    try {
      const result = await mutateV2Exercise(form);
      setFeedback(result);
      setUnavailable(!result.data);
      if (result.data) setData(result.data);
      if (result.status === "success") {
        if (intent === "create") setName("");
        if (intent === "assign") setAssignedPlan(String(form.get("templateId")));
      }
      router.refresh();
    } catch (error) {
      unstable_rethrow(error);
      setUnavailable(true);
      setFeedback({ status: "error", data: null, message: "We couldn’t confirm the change. Check the saved library before trying again." });
    } finally {
      lock.current = false;
      setPending(false);
    }
  }
  function _feedback(target: string) {
    if (feedbackTarget !== target) return null;
    return <>
      {pending && <p role="status">Checking saved library…</p>}
      {feedback && <p role={feedback.status === "error" ? "alert" : "status"} className={feedback.status === "error" ? "v2-error" : "v2-plan-saved"}>{feedback.message}</p>}
      {assignedPlan && <ButtonLink variant="secondary" href={`/v2/library/plans/${assignedPlan}`}>Edit plan prescription</ButtonLink>}
    </>;
  }
  const disabled = pending || unavailable;
  return <>
    <Card>
      <h2 id="create-exercise" tabIndex={-1}>Create exercise</h2>
      <form className="v2-plan-name-form" aria-label="Create exercise" aria-busy={pending && feedbackTarget === "create"} onSubmit={event => {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        form.set("intent", "create");
        void _mutate(form, "create");
      }}>
        <Input id="exercise-name" name="name" label="Exercise name" required maxLength={80} value={name} disabled={disabled} placeholder="e.g. Cable row" onChange={event => setName(event.target.value)} />
        <p className="v2-muted">Choose a unique name, including across archived exercises. Up to 80 characters.</p>
        <div className="v2-actions">
          <Button type="submit" disabled={disabled}>Create exercise</Button>
          {name && <Button variant="quiet" disabled={pending} onClick={() => setName("")}>Discard name</Button>}
        </div>
        {_feedback("create")}
      </form>
    </Card>
    {unavailable && <Card>
      <h2>Saved library unavailable</h2>
      <p>Changes are paused until we can verify your exercises and plans.</p>
      <Button disabled={pending} onClick={() => {
        const form = new FormData(); form.set("intent", "refresh"); void _mutate(form, "recovery");
      }}>Check saved library</Button>
      {_feedback("recovery")}
    </Card>}
    {!unavailable && _feedback("recovery")}
    {_feedback("archive")}
    <LibraryBrowser view="exercises" exercises={data.exercises} exerciseActions={exercise => {
      const eligiblePlans = data.plans.filter(plan => !plan.exercises.some(item => item.exerciseId === exercise.id));
      return <div className="v2-exercise-management">
        <div className="v2-actions">
          {!exercise.isArchived && (data.plans.length === 0
            ? <ButtonLink variant="secondary" href="/v2/library/plans/new">Create a plan</ButtonLink>
            : eligiblePlans.length === 0
              ? <span className="v2-muted">Added to all active plans</span>
              : <details className="v2-exercise-assignment">
                <summary className="v2-button v2-button--secondary">Add to plan</summary>
                <PlanAssignment exerciseId={exercise.id} exerciseName={exercise.name} plans={eligiblePlans}
                  disabled={disabled} onAssign={form => { void _mutate(form, exercise.id); }} />
              </details>)}
          {!exercise.isSystemExercise && <Button variant="quiet" disabled={disabled} aria-label={`${exercise.isArchived ? "Restore" : "Archive"} ${exercise.name}`} onClick={() => {
            const form = new FormData(); form.set("intent", exercise.isArchived ? "restore" : "archive"); form.set("exerciseId", exercise.id); void _mutate(form, "archive");
          }}>{exercise.isArchived ? "Restore" : "Archive"}</Button>}
        </div>
        {_feedback(exercise.id)}
      </div>;
    }} />
  </>;
}
