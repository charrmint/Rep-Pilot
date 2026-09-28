import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getWorkoutTemplateDetails } from "@/features/templates/template-service";
import { getV2Context } from "../server/context";
import { Card, PageHeader } from "../ui/primitives";
import { PlanNameForm } from "./plan-name-form";
import { PlanEditor } from "./plan-editor";
import { listAvailableExercises } from "@/features/exercises/exercise-service";

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
  const availableExercises = await listAvailableExercises();
  return <>
    <Link className="v2-text-link" href="/v2/library">Back to plans</Link>
    <PageHeader eyebrow={plan.isArchived ? "Library · Archived plan" : "Library · Plan"} title={plan.name} description="Shape your next session, one exercise at a time." />
    <PlanEditor key={plan.id} initialData={{ plan, availableExercises }} />
    <div className="v2-actions">
      <Link className="v2-text-link" href="/templates">{plan.isArchived ? "Restore this plan in classic" : "Manage archives in classic"}</Link>
      <Link className="v2-text-link" href={`/workouts/templates/${plan.id}`}>View plan history</Link>
    </div>
  </>;
}
