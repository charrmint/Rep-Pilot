import { redirect } from "next/navigation";
import { connection } from "next/server";

import { getCurrentUser } from "@/features/auth/auth-server-service";
import { TemplateHistoryList } from "@/features/workouts/components/template-history-list";
import { listTemplateHistorySummaries } from "@/features/workouts/workout-service";

import { WorkoutHistoryShell } from "../_shared/workout-history-shell";

export default async function TemplateHistoryPage() {
  await connection();

  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const templates = await listTemplateHistorySummaries(user.id);

  return (
    <WorkoutHistoryShell
      activeView="templates"
      userEmail={user.email}
      eyebrow="Template History"
      title="Training plan history"
      description="Choose a template to compare its completed and abandoned workout logs."
    >
      <TemplateHistoryList templates={templates} />
    </WorkoutHistoryShell>
  );
}
