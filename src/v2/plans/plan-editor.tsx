"use client";

import Link from "next/link";
import { useCallback, useRef, useState } from "react";
import { useRouter, unstable_rethrow } from "next/navigation";
import { DEFAULT_WORKOUT_TEMPLATE_EXERCISE_CONFIG } from "@/features/templates/template-defaults";
import { Button, Card } from "../ui/primitives";
import { useLeaveWarning } from "../workouts/use-leave-warning";
import { PlanNameForm } from "./plan-name-form";
import { ExercisePicker } from "./exercise-picker";
import { PlanConfigFields } from "./plan-config-fields";
import { mutateV2PlanArchive } from "./archive-actions";
import { mutateV2PlanExercise, reloadV2Plan } from "./exercise-actions";
import { sameExerciseDraft, toExerciseDraft } from "./exercise-drafts";
import type { PlanEditorData, PlanExerciseDraft, PlanMutationIntent } from "./types";

const EMPTY_ADD_DRAFT = toExerciseDraft(DEFAULT_WORKOUT_TEMPLATE_EXERCISE_CONFIG);

export function PlanEditor({ initialData }: { initialData: PlanEditorData }) {
  const router = useRouter();
  const lock = useRef(false);
  const [data, setData] = useState(initialData);
  const [drafts, setDrafts] = useState<Record<string, PlanExerciseDraft>>({});
  const [addDraft, setAddDraft] = useState(EMPTY_ADD_DRAFT);
  const [selectedId, setSelectedId] = useState("");
  const [query, setQuery] = useState("");
  const [archiveFeedback, setArchiveFeedback] = useState(false);
  const [pending, setPending] = useState(false);
  const [unavailable, setUnavailable] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [nameActivity, setNameActivity] = useState({ dirty: false, pending: false });
  const namePending = useRef(false);
  const _nameActivity = useCallback((dirty: boolean, isPending: boolean) => {
    namePending.current = isPending;
    setNameActivity({ dirty, pending: isPending });
  }, []);
  const configuredIds = new Set(data.plan.exercises.map((exercise) => exercise.exerciseId));
  const available = data.availableExercises.filter((exercise) => !exercise.isArchived && !configuredIds.has(exercise.id));
  const addDirty = Boolean(selectedId) || !sameExerciseDraft(addDraft, EMPTY_ADD_DRAFT);
  const dirty = nameActivity.dirty || addDirty || Object.keys(drafts).length > 0;
  const busy = pending || nameActivity.pending;
  const disabled = busy || unavailable;
  useLeaveWarning(dirty, busy, "Leave this plan? Unsaved edits will be lost. Saved exercises are kept.");

  function _draft(id: string, draft: PlanExerciseDraft) {
    const exercise = data.plan.exercises.find((item) => item.id === id);
    setDrafts((current) => {
      const next = { ...current };
      if (exercise && sameExerciseDraft(draft, toExerciseDraft(exercise.config))) delete next[id];
      else next[id] = draft;
      return next;
    });
    setMessage(null);
  }

  function _apply(next: PlanEditorData, savedId?: string) {
    setData(next);
    setUnavailable(false);
    setDrafts((current) => Object.fromEntries(next.plan.exercises.flatMap((exercise) => {
      const draft = current[exercise.id];
      return draft && exercise.id !== savedId && !sameExerciseDraft(draft, toExerciseDraft(exercise.config))
        ? [[exercise.id, draft]] : [];
    })));
    if (selectedId && next.plan.exercises.some((exercise) => exercise.exerciseId === selectedId)) {
      setSelectedId(""); setAddDraft(EMPTY_ADD_DRAFT); setQuery("");
    }
  }

  async function _recover() {
    if (lock.current || namePending.current) return;
    lock.current = true; setPending(true);
    try {
      _apply(await reloadV2Plan(data.plan.id));
      setError(null); setMessage("Saved plan loaded. Review it before making another change.");
      router.refresh();
    } catch (error) {
      unstable_rethrow(error);
      setUnavailable(true); setError("We couldn’t load the saved plan. Your drafts are still here.");
    } finally { lock.current = false; setPending(false); }
  }

  async function _mutate(intent: PlanMutationIntent, formData: FormData, id?: string) {
    if (lock.current || namePending.current || unavailable) return;
    const changingArchive = intent === "archive" || intent === "restore";
    if (changingArchive && dirty) return;
    if (intent === "archive" && !window.confirm(
      "Archive this plan? It will be hidden from new workout starts. Your active workout and history stay unchanged. You can restore it from Library’s Archived filter.",
    )) return;
    setArchiveFeedback(changingArchive);
    if (intent === "remove" && !window.confirm(
      `Remove ${data.plan.exercises.find((exercise) => exercise.id === id)?.exerciseName} from this plan?${id && drafts[id] ? " Its unsaved edits will be discarded." : ""} Past workouts stay unchanged.`,
    )) return;
    lock.current = true; setPending(true); setError(null); setMessage(null);
    formData.set("templateId", data.plan.id);
    formData.set("intent", intent);
    if (id) formData.set("templateExerciseId", id);
    try {
      const result = await (changingArchive ? mutateV2PlanArchive(formData) : mutateV2PlanExercise(formData));
      if (result.data) {
        _apply(result.data, result.status === "success" && intent === "save" ? id : undefined);
        router.refresh();
      } else {
        setUnavailable(true);
      }
      if (result.status === "error") setError(result.message);
      else setMessage(result.message);
    } catch (error) {
      unstable_rethrow(error);
      setError("We couldn’t confirm the change. Review the saved plan before trying again.");
      try { _apply(await reloadV2Plan(data.plan.id)); router.refresh(); }
      catch (reloadError) { unstable_rethrow(reloadError); setUnavailable(true); }
    } finally { lock.current = false; setPending(false); }
  }

  const feedback = <>
        {error && <p className="v2-error" role="alert">{error}</p>}
        {message && <p className="v2-plan-saved" role="status">{message}</p>}
        {pending && <p role="status">Updating plan…</p>}
        {unavailable && <Card>
          <p>Check the saved plan to continue. Your unsaved edits are kept on this page.</p>
          <Button disabled={busy} onClick={_recover}>Check saved plan</Button>
        </Card>}
  </>;

  return (
    <>
      <Card><PlanNameForm plan={initialData.plan} disabled={pending || unavailable} onActivityChange={_nameActivity} /></Card>
      <section className="v2-plan-editor" aria-labelledby="plan-exercises-heading" aria-busy={pending}>
        <div className="v2-section-heading"><h2 id="plan-exercises-heading">Exercises</h2><span className="v2-muted">{data.plan.exercises.length} total</span></div>
        <p className="v2-muted">Save each exercise when it’s ready. Changes apply to future workouts; active and past workouts keep their saved settings.</p>
        {!archiveFeedback && feedback}
        {data.plan.exercises.length === 0 && <Card><p>No exercises yet. Add your first exercise below.</p></Card>}
        <ol className="v2-plan-editor-list">
          {data.plan.exercises.map((exercise, index) => (
            <li key={exercise.id}>
              <Card className="v2-plan-exercise-card">
                <div className="v2-plan-exercise-heading">
                  <div><p className="v2-eyebrow">Exercise {index + 1}</p><h3>{exercise.exerciseName}</h3>
                    <p className="v2-muted">{exercise.exerciseIsSystemExercise ? "Built-in exercise" : "Custom exercise"}{exercise.exerciseIsArchived ? " · Archived exercise" : ""}</p>
                  </div>
                  <div className="v2-actions" role="group" aria-label={`Arrange ${exercise.exerciseName}`}>
                    <Button variant="quiet" disabled={disabled || index === 0} aria-label={`Move ${exercise.exerciseName} up`} onClick={() => _mutate("move_up", new FormData(), exercise.id)}>Up</Button>
                    <Button variant="quiet" disabled={disabled || index === data.plan.exercises.length - 1} aria-label={`Move ${exercise.exerciseName} down`} onClick={() => _mutate("move_down", new FormData(), exercise.id)}>Down</Button>
                    <Button variant="quiet" disabled={disabled} aria-label={`Remove ${exercise.exerciseName}`} onClick={() => _mutate("remove", new FormData(), exercise.id)}>Remove</Button>
                  </div>
                </div>
                <form aria-label={`Configure ${exercise.exerciseName}`} onSubmit={(event) => {
                  event.preventDefault(); void _mutate("save", new FormData(event.currentTarget), exercise.id);
                }}>
                  <fieldset disabled={disabled}>
                    <legend className="sr-only">{exercise.exerciseName} settings</legend>
                    <PlanConfigFields prefix={exercise.id} draft={drafts[exercise.id] ?? toExerciseDraft(exercise.config)} onChange={(draft) => _draft(exercise.id, draft)} />
                    <div className="v2-actions">
                      <Button type="submit" disabled={disabled || !drafts[exercise.id]}>Save exercise</Button>
                      {drafts[exercise.id] && <Button variant="quiet" onClick={() => _draft(exercise.id, toExerciseDraft(exercise.config))}>Discard edits</Button>}
                    </div>
                  </fieldset>
                </form>
              </Card>
            </li>
          ))}
        </ol>
        <Card className="v2-plan-exercise-card">
          <h2>Add exercise</h2>
          <p className="v2-muted">Choose an active exercise from your library and set its starting targets.</p>
          {available.length === 0 ? <p>All available exercises are already in this plan, or your library has no active exercises.</p> : (
            <form aria-label="Add exercise" onSubmit={(event) => { event.preventDefault(); if (available.some((exercise) => exercise.id === selectedId)) void _mutate("add", new FormData(event.currentTarget)); }}>
              <fieldset disabled={disabled}>
                <legend className="sr-only">New exercise settings</legend>
                <ExercisePicker exercises={available} selectedId={selectedId} query={query} disabled={disabled}
                  onQueryChange={(value) => { setQuery(value); setSelectedId(""); setMessage(null); }}
                  onSelect={(exercise) => { setSelectedId(exercise.id); setQuery(exercise.name); setMessage(null); }} />
                <PlanConfigFields prefix="new-exercise" draft={addDraft} onChange={(draft) => { setAddDraft(draft); setMessage(null); }} />
                <div className="v2-actions">
                  <Button type="submit" disabled={disabled || !available.some((exercise) => exercise.id === selectedId)}>Add to plan</Button>
                  {addDirty && <Button variant="quiet" onClick={() => { setSelectedId(""); setQuery(""); setAddDraft(EMPTY_ADD_DRAFT); setMessage(null); }}>Discard new exercise</Button>}
                </div>
              </fieldset>
            </form>
          )}
          <Link className="v2-text-link" href="/exercises">Manage exercises in classic</Link>
        </Card>
      </section>
      <Card className="v2-plan-overview">
        <h2>{archiveFeedback && unavailable ? "Plan status unavailable" : data.plan.isArchived ? "Archived plan" : "Archive plan"}</h2>
        <p className="v2-muted">
          {archiveFeedback && unavailable
            ? "We couldn’t verify whether this plan is archived. Check the saved plan before making another change."
            : data.plan.isArchived
            ? "This plan is hidden from new workout starts. Restore it to return it to your active plans."
            : "Keep this plan and its history, but hide it from new workout starts. You can restore it later from Library’s Archived filter."}
          {" "}Active workouts and past results stay unchanged.
        </p>
        {dirty && <p id="plan-archive-drafts" className="v2-muted">Save or discard your name and exercise edits before archiving or restoring this plan.</p>}
        <div className="v2-actions">
          <Button variant="secondary" disabled={disabled || dirty}
            aria-describedby={dirty ? "plan-archive-drafts" : undefined}
            onClick={() => _mutate(data.plan.isArchived ? "restore" : "archive", new FormData())}>
            {archiveFeedback && pending ? "Checking plan…" : data.plan.isArchived ? "Restore plan" : "Archive plan"}
          </Button>
          <Link className="v2-text-link" href="/v2/library">Back to library</Link>
        </div>
        {archiveFeedback && feedback}
      </Card>
    </>
  );
}
