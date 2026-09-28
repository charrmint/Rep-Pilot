import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getWorkoutTemplateDetails } from "@/features/templates/template-service";
import { getV2Context } from "../server/context";
import { ButtonLink, Card, PageHeader } from "../ui/primitives";
import { PlanNameForm } from "./plan-name-form";

export async function NewPlanScreen() {
  const { user } = await getV2Context();
  if (!user) redirect("/login");
  return <>
    <Link className="v2-text-link" href="/v2/library">Back to plans</Link>
    <PageHeader eyebrow="Library · New plan" title="Give your routine a name." description="Start with a name, then add the exercises you want to train." />
    <Card><PlanNameForm /></Card>
  </>;
}

export async function PlanScreen({ templateId }: { templateId: string }) {
  const { user } = await getV2Context();
  if (!user) redirect("/login");
  const plan = await getWorkoutTemplateDetails({ userId: user.id, templateId });
  if (!plan) notFound();
  return <>
    <Link className="v2-text-link" href="/v2/library">Back to plans</Link>
    <PageHeader eyebrow={plan.isArchived ? "Library · Archived plan" : "Library · Plan"} title={plan.name} description="Shape your next session, one exercise at a time." />
    <Card><PlanNameForm key={plan.id} plan={plan} /></Card>
    <Card className="v2-plan-overview">
      <div className="v2-section-heading"><h2>Exercises</h2><span className="v2-muted">{plan.exercises.length} total</span></div>
      {plan.exercises.length ? <ol className="v2-plan-exercise-preview">
        {plan.exercises.map((exercise) => <li key={exercise.id}>
          <span>{exercise.exerciseName}{exercise.exerciseIsArchived && <span className="v2-muted"> · Archived exercise</span>}</span>
          <span className="v2-muted">{exercise.config.targetSets} × {exercise.config.minReps}–{exercise.config.maxReps} reps</span>
        </li>)}
      </ol> : <p className="v2-muted">No exercises yet. Add exercises before starting a workout.</p>}
      <p className="v2-classic-note">Exercise editing opens in the classic app.</p>
      <div className="v2-actions"><ButtonLink variant="secondary" href={`/templates/${plan.id}/edit`}>{plan.exercises.length ? "Edit exercises in classic" : "Add exercises in classic"}</ButtonLink></div>
    </Card>
    <div className="v2-actions">
      <Link className="v2-text-link" href="/templates">{plan.isArchived ? "Restore this plan in classic" : "Manage archives in classic"}</Link>
      <Link className="v2-text-link" href={`/workouts/templates/${plan.id}`}>View plan history</Link>
    </div>
  </>;
}
