"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, unstable_rethrow } from "next/navigation";
import { Button, Input } from "../ui/primitives";
import { useLeaveWarning } from "../workouts/use-leave-warning";
import { createV2Plan, renameV2Plan } from "./actions";
import type { PlanNameFormProps } from "./types";

export function PlanNameForm({ plan, disabled = false, onActivityChange }: PlanNameFormProps) {
  const router = useRouter();
  const lock = useRef(false);
  const [name, setName] = useState(plan?.name ?? "");
  const [savedName, setSavedName] = useState(plan?.name ?? "");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const dirty = name !== savedName;
  useEffect(() => { onActivityChange?.(dirty, pending); }, [dirty, pending, onActivityChange]);
  useLeaveWarning(!onActivityChange && dirty, !onActivityChange && pending, "Leave this plan? Your unsaved name will be lost.");

  async function _submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (lock.current || disabled) return;
    const data = new FormData(event.currentTarget);
    lock.current = true;
    setPending(true);
    onActivityChange?.(dirty, true);
    setError(null);
    setSaved(false);
    let navigating = false;
    try {
      const result = await (plan ? renameV2Plan(data) : createV2Plan(data));
      if (result.status === "error") {
        setError(result.message);
        return;
      }
      setName(result.plan.name);
      setSavedName(result.plan.name);
      if (plan) {
        setSaved(true);
        router.refresh();
      } else {
        router.replace(`/v2/library/plans/${result.plan.id}`);
        router.refresh();
        navigating = true;
      }
    } catch (error) {
      unstable_rethrow(error);
      setError("We couldn’t confirm the save. Check your library before trying again.");
    } finally {
      if (!navigating) {
        lock.current = false;
        setPending(false);
      }
    }
  }

  return (
    <form onSubmit={_submit} className="v2-plan-name-form" aria-label={plan ? "Rename plan" : "Create plan"} aria-busy={pending}>
      {plan && <input type="hidden" name="templateId" value={plan.id} />}
      <Input id="plan-name" label="Plan name" name="name" value={name} required maxLength={80}
        disabled={pending || disabled} autoComplete="off" placeholder="e.g. Upper body"
        aria-describedby={error ? "plan-name-help plan-name-error" : "plan-name-help"}
        onChange={(event) => { setName(event.target.value); setError(null); setSaved(false); }} />
      <p id="plan-name-help" className="v2-muted">Choose a name you’ll recognize in your library. Up to 80 characters.</p>
      <div className="v2-actions">
        <Button type="submit" disabled={pending || disabled || (Boolean(plan) && !dirty)}>
          {pending ? (plan ? "Saving…" : "Creating…") : (plan ? "Save name" : "Create plan")}
        </Button>
        {plan && dirty && <Button variant="quiet" disabled={pending || disabled} onClick={() => { setName(savedName); setError(null); setSaved(false); }}>Discard changes</Button>}
      </div>
      {error && <p id="plan-name-error" className="v2-error" role="alert">{error}</p>}
      {saved && <p className="v2-plan-saved" role="status">Plan name saved.</p>}
    </form>
  );
}
