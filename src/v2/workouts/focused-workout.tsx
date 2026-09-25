"use client";

import { useRef, useState } from "react";
import { unstable_rethrow } from "next/navigation";
import type {
  WorkoutSessionExercise,
  WorkoutSet,
} from "@/features/workouts/types";
import {
  saveWorkoutSetAction,
  deleteWorkoutSetAction,
} from "@/features/workouts/workout-actions";
import { validateWorkoutSetInput } from "@/features/workouts/workout-validation";
import { Button, ButtonLink, Card } from "../ui/primitives";
import type { ExerciseDrafts, SetDraft, WorkoutScreenProps } from "./types";
import {
  createDraft,
  nextPlannedPosition,
  plannedSetCount,
} from "./editor-state";
import { reloadV2Workout } from "./actions";
import { SetEditor } from "./set-editor";
import { ExerciseContext } from "./exercise-context";
import { ElapsedTime } from "./elapsed-time";
import { useLeaveWarning } from "./use-leave-warning";

export function FocusedWorkout({ initialWorkout }: WorkoutScreenProps) {
  const [workout, setWorkout] = useState(initialWorkout);
  const [exerciseId, setExerciseId] = useState(
    (
      initialWorkout.exercises.find(
        (exercise) => nextPlannedPosition(exercise) !== null,
      ) ?? initialWorkout.exercises[0]
    )?.id,
  );
  const [drafts, setDrafts] = useState<ExerciseDrafts>({});
  const [positions, setPositions] = useState<Record<string, number | null>>({});
  const [pending, setPending] = useState(false);
  const lock = useRef(false);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const [unverified, setUnverified] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const exercise = workout.exercises.find((item) => item.id === exerciseId);
  const position = exercise
    ? positions[exercise.id] === undefined
      ? nextPlannedPosition(exercise)
      : positions[exercise.id]
    : null;
  const saved = exercise?.sets.find((set) => set.position === position);
  const draft =
    exercise && position !== null
      ? (drafts[exercise.id]?.[position] ?? createDraft(exercise, position))
      : null;
  const dirty = Object.values(drafts).some((group) =>
    Object.values(group).some((value) => value?.dirty),
  );
  useLeaveWarning(dirty && workout.status === "in_progress", pending);
  const planned = workout.exercises.reduce(
    (sum, item) => sum + item.targetSets,
    0,
  );
  const completed = workout.exercises.reduce(
    (sum, item) => sum + plannedSetCount(item),
    0,
  );
  const logged = workout.exercises.reduce(
    (sum, item) => sum + item.sets.length,
    0,
  );

  function _selectExercise(id: string) {
    setExerciseId(id);
    setDeleteId(null);
    setNotice("");
    requestAnimationFrame(() => {
      headingRef.current?.focus({ preventScroll: true });
      headingRef.current?.scrollIntoView?.({ block: "start" });
    });
  }
  function _changeDraft(value: SetDraft) {
    if (!exercise || position === null) return;
    setPositions((current) => ({ ...current, [exercise.id]: position }));
    setDrafts((current) => ({
      ...current,
      [exercise.id]: { ...current[exercise.id], [position]: value },
    }));
  }
  function _clearDraft(id: string, slot: number) {
    setDrafts((current) => {
      const group = { ...current[id] };
      delete group[slot];
      return { ...current, [id]: group };
    });
  }
  function _selectPosition(slot: number | null) {
    if (exercise)
      setPositions((current) => ({ ...current, [exercise.id]: slot }));
    setDeleteId(null);
    setNotice("");
  }
  function _nextDraft(item: WorkoutSessionExercise) {
    const existing = Object.keys(drafts[item.id] ?? {})
      .map(Number)
      .sort((a, b) => a - b)
      .find((slot) => !item.sets.some((set) => set.position === slot));
    return existing ?? nextPlannedPosition(item);
  }
  async function _reconcile() {
    const latest = await reloadV2Workout(workout.id);
    setWorkout(latest);
    setUnverified(false);
    return latest;
  }
  async function _recover() {
    try {
      await _reconcile();
      setError(
        "The request could not be confirmed. Saved sets have been refreshed; review them before retrying. Your input is kept.",
      );
    } catch (error) {
      unstable_rethrow(error);
      setUnverified(true);
      setError(
        "Connection lost. Your input is kept. Check saved sets before trying again.",
      );
    }
  }
  async function _checkSaved() {
    if (lock.current) return;
    lock.current = true;
    setPending(true);
    try {
      await _reconcile();
      setError(null);
      setNotice("Saved sets refreshed. Review your input before continuing.");
    } catch (error) {
      unstable_rethrow(error);
      setError("Still unable to check saved sets. Please try again.");
    } finally {
      lock.current = false;
      setPending(false);
    }
  }
  async function _save() {
    if (!exercise || position === null || !draft || lock.current || unverified)
      return;
    const input = {
      sessionExerciseId: exercise.id,
      workoutSetId: saved?.id,
      position,
      weightValue: Number(draft.weight),
      weightUnit: draft.unit,
      reps: Number(draft.reps),
      rir: draft.rir,
    };
    try {
      if (draft.weight.trim() === "" || draft.reps.trim() === "")
        throw new Error("Enter weight and reps.");
      validateWorkoutSetInput(input);
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Check the set values.",
      );
      return;
    }
    lock.current = true;
    setPending(true);
    setError(null);
    setNotice("");
    try {
      const result = await saveWorkoutSetAction(input);
      const sets = [
        ...exercise.sets.filter((set) => set.position !== result.position),
        result,
      ].sort((a, b) => a.position - b.position);
      const updated = { ...exercise, sets };
      setWorkout((current) => ({
        ...current,
        exercises: current.exercises.map((item) =>
          item.id === exercise.id ? updated : item,
        ),
      }));
      _clearDraft(exercise.id, position);
      setPositions((current) => ({
        ...current,
        [exercise.id]: _nextDraft(updated),
      }));
      setNotice(`Set ${position} ${saved ? "updated" : "saved"}.`);
    } catch (error) {
      unstable_rethrow(error);
      await _recover();
    } finally {
      lock.current = false;
      setPending(false);
    }
  }
  async function _delete(set: WorkoutSet) {
    if (!exercise || lock.current || unverified) return;
    lock.current = true;
    setPending(true);
    setError(null);
    setNotice("");
    try {
      await deleteWorkoutSetAction({
        sessionExerciseId: exercise.id,
        workoutSetId: set.id,
      });
      const updated = {
        ...exercise,
        sets: exercise.sets.filter((item) => item.id !== set.id),
      };
      setWorkout((current) => ({
        ...current,
        exercises: current.exercises.map((item) =>
          item.id === exercise.id ? updated : item,
        ),
      }));
      _clearDraft(exercise.id, set.position);
      if (position === set.position || position === null)
        setPositions((current) => ({
          ...current,
          [exercise.id]: nextPlannedPosition(updated),
        }));
      setDeleteId(null);
      setNotice(`Set ${set.position} deleted.`);
    } catch (error) {
      unstable_rethrow(error);
      await _recover();
    } finally {
      lock.current = false;
      setPending(false);
    }
  }

  if (workout.status !== "in_progress")
    return (
      <Card className="v2-empty">
        <h1>
          {workout.status === "completed"
            ? "Workout complete"
            : "Workout abandoned"}
        </h1>
        <p>This session is read-only. Your logged sets are saved.</p>
        <ButtonLink href={`/workouts/${workout.id}`}>
          View workout results
        </ButtonLink>
        <ButtonLink variant="secondary" href="/v2">
          Back to Today
        </ButtonLink>
      </Card>
    );
  if (!exercise)
    return (
      <Card className="v2-empty">
        <h1>No exercises in this workout</h1>
        <ButtonLink href={`/workouts/${workout.id}`}>
          Open workout options
        </ButtonLink>
      </Card>
    );
  const nextExercise =
    workout.exercises[workout.exercises.indexOf(exercise) + 1];
  return (
    <div className="v2-focused-workout">
      <header className="v2-workout-header">
        <ButtonLink variant="quiet" href="/v2">
          ← Today
        </ButtonLink>
        <div>
          <strong>{workout.templateName}</strong>
          <ElapsedTime startedAt={workout.startedAt} />
        </div>
        <ButtonLink variant="quiet" href={`/workouts/${workout.id}`}>
          Options
        </ButtonLink>
      </header>
      <nav className="v2-exercise-tabs" aria-label="Workout exercises">
        {workout.exercises.map((item) => (
          <Button
            key={item.id}
            variant="secondary"
            disabled={pending}
            aria-current={item.id === exercise.id ? "step" : undefined}
            onClick={() => {
              _selectExercise(item.id);
            }}
          >
            <span>
              {plannedSetCount(item) === item.targetSets ? "✓" : item.position}
            </span>{" "}
            {item.exerciseName}
          </Button>
        ))}
      </nav>
      <div className="v2-section-heading">
        <div>
          <p className="v2-eyebrow">
            Exercise {exercise.position} of {workout.exercises.length}
          </p>
          <h1 ref={headingRef} tabIndex={-1} className="v2-exercise-heading">
            {exercise.exerciseName}
          </h1>
        </div>
        <span className="v2-chip">
          {plannedSetCount(exercise)} / {exercise.targetSets} planned
        </span>
      </div>
      <p className="v2-muted">
        {exercise.targetSets} sets · {exercise.minReps}–{exercise.maxReps} reps
        · Planned {exercise.plannedWeightValue} {exercise.plannedWeightUnit}
      </p>
      <ExerciseContext
        exercise={exercise}
        disabled={pending || unverified || Boolean(saved) || !draft}
        onApply={(weight) => {
          if (draft) _changeDraft({ ...draft, weight, dirty: true });
        }}
      />
      <section aria-label="Logged sets">
        <div className="v2-section-heading">
          <h2>Working sets</h2>
          <span className="v2-muted">{exercise.sets.length} saved</span>
        </div>
        {exercise.sets.length ? (
          <ol className="v2-saved-sets">
            {exercise.sets.map((set) => (
              <li key={set.id}>
                <div>
                  <strong>Set {set.position}</strong>
                  <span>
                    {set.weightValue} {set.weightUnit} × {set.reps}
                    {set.rir !== null && ` · ${set.rir} RIR`}
                  </span>
                </div>
                <div className="v2-actions">
                  <Button
                    variant="quiet"
                    disabled={pending || unverified}
                    aria-label={`Edit set ${set.position}`}
                    onClick={() => _selectPosition(set.position)}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="quiet"
                    disabled={pending || unverified}
                    aria-label={`Delete set ${set.position}`}
                    onClick={() => setDeleteId(set.id)}
                  >
                    Delete
                  </Button>
                </div>
                {deleteId === set.id && (
                  <div className="v2-delete-confirm">
                    <p>
                      Delete set {set.position}? This also discards any unsaved
                      edits to this set.
                    </p>
                    <div className="v2-actions">
                      <Button
                        variant="secondary"
                        disabled={pending}
                        onClick={() => _delete(set)}
                      >
                        Confirm delete
                      </Button>
                      <Button
                        variant="quiet"
                        disabled={pending}
                        onClick={() => setDeleteId(null)}
                      >
                        Keep set
                      </Button>
                    </div>
                  </div>
                )}
              </li>
            ))}
          </ol>
        ) : (
          <p className="v2-muted">No sets logged yet.</p>
        )}
      </section>
      {error && (
        <div className="v2-workout-error" role="alert">
          <p>{error}</p>
          {unverified && (
            <Button
              disabled={pending}
              variant="secondary"
              onClick={_checkSaved}
            >
              Check saved sets
            </Button>
          )}
        </div>
      )}
      <p className="v2-save-notice" role="status">
        {pending ? "Saving or checking your sets…" : notice}
      </p>
      {draft && position !== null ? (
        <SetEditor
          exercise={exercise}
          position={position}
          draft={draft}
          editing={Boolean(saved)}
          disabled={pending || unverified}
          onChange={_changeDraft}
          onSave={_save}
          onCancel={() => {
            _clearDraft(exercise.id, position);
            _selectPosition(_nextDraft(exercise));
          }}
        />
      ) : (
        <Card>
          <h2>Planned sets logged.</h2>
          <p className="v2-muted">
            Review your sets, add another, or move to the next exercise.
          </p>
        </Card>
      )}
      <div className="v2-actions">
        {position === null && (
          <Button
            variant="secondary"
            disabled={pending || unverified}
            onClick={() =>
              _selectPosition(
                Math.max(
                  exercise.targetSets,
                  ...exercise.sets.map((set) => set.position),
                  ...Object.keys(drafts[exercise.id] ?? {}).map(Number),
                ) + 1,
              )
            }
          >
            Add another set
          </Button>
        )}
        {nextExercise && (
          <Button
            variant="secondary"
            disabled={pending}
            onClick={() => {
              _selectExercise(nextExercise.id);
            }}
          >
            Next: {nextExercise.exerciseName} →
          </Button>
        )}
      </div>
      <footer className="v2-workout-footer">
        <div>
          <strong>
            {completed} of {planned} planned sets
          </strong>
          <span>
            {logged} total logged ·{" "}
            {dirty ? "Unlogged changes" : "Logged sets saved"}
          </span>
        </div>
        <ButtonLink variant="secondary" href={`/workouts/${workout.id}`}>
          Finish / abandon
        </ButtonLink>
      </footer>
    </div>
  );
}
