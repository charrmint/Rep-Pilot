import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getExerciseHistory, getTemplateHistory, getWorkoutSession, listExerciseHistorySummaries, listRecentWorkoutHistory, listTemplateHistorySummaries } from "@/features/workouts/workout-service";
import { getHistoryRecommendations } from "@/features/workouts/history-recommendations";
import { parseWorkoutHistoryPage } from "@/features/workouts/workout-history";
import { getV2Context } from "../server/context";
import { Card } from "../ui/primitives";
import { SignInCard } from "../ui/sign-in-card";
import { WorkoutResults } from "../workouts/workout-results";
import { HistoryDate, HistoryDecision, HistoryEmpty, HistoryFrame, HistoryPagination, HistorySets } from "./history-ui";
import { SessionList } from "./session-list";
import type { HistoryPageProps } from "./types";

export async function HistoryScreen({ searchParams }: HistoryPageProps) {
  const { user } = await getV2Context();
  if (!user) return <HistoryFrame view="sessions" title="Progress, with context."><SignInCard /></HistoryFrame>;
  const history = await listRecentWorkoutHistory({ userId: user.id, page: parseWorkoutHistoryPage((await searchParams).page) });
  const recommendations = await getHistoryRecommendations(user.id, history.items.filter(session => session.status === "completed").flatMap(session => session.exercises.map(exercise => exercise.sessionExerciseId)));
  return <HistoryFrame view="sessions" title="Progress, with context.">
    <SessionList sessions={history.items} recommendations={recommendations} />
    <HistoryPagination {...history} basePath="/v2/history" />
  </HistoryFrame>;
}

export async function PlanHistoryIndex() {
  const { user } = await getV2Context();
  if (!user) redirect("/login");
  const plans = await listTemplateHistorySummaries(user.id);
  return <HistoryFrame view="plans" title="History by plan">
    {!plans.length ? <HistoryEmpty message="Plans with completed or abandoned workouts will appear here." /> : <ul className="v2-history-stack">{plans.map(plan => <li key={plan.templateId}><Card>
      <h2><Link className="v2-text-link" href={`/v2/history/plans/${plan.templateId}`}>{plan.templateName}</Link></h2>
      <p className="v2-muted">{plan.workoutCount} sessions{plan.isArchived ? " · Archived plan" : ""}</p>
      <p>Last performed <HistoryDate value={plan.lastPerformedAt} /></p>
    </Card></li>)}</ul>}
  </HistoryFrame>;
}

export async function ExerciseHistoryIndex() {
  const { user } = await getV2Context();
  if (!user) redirect("/login");
  const exercises = await listExerciseHistorySummaries(user.id);
  return <HistoryFrame view="exercises" title="History by exercise">
    {!exercises.length ? <HistoryEmpty message="Exercises with logged working sets will appear here." /> : <ul className="v2-history-stack">{exercises.map(exercise => <li key={exercise.exerciseId}><Card>
      <h2><Link className="v2-text-link" href={`/v2/history/exercises/${exercise.exerciseId}`}>{exercise.exerciseName}</Link></h2>
      <p className="v2-muted">{exercise.performanceCount} performances</p>
      <p>Last performed <HistoryDate value={exercise.lastPerformedAt} /></p>
    </Card></li>)}</ul>}
  </HistoryFrame>;
}

export async function PlanHistoryScreen({ templateId, page }: { templateId: string; page: number }) {
  const { user } = await getV2Context();
  if (!user) redirect("/login");
  const history = await getTemplateHistory({ userId: user.id, templateId, page });
  if (!history) notFound();
  const recommendations = await getHistoryRecommendations(user.id, history.workouts.items.filter(session => session.status === "completed").flatMap(session => session.exercises.map(exercise => exercise.sessionExerciseId)));
  return <HistoryFrame view="plans" title={history.template.name}>
    <div className="v2-actions"><Link className="v2-text-link" href="/v2/history/plans">← All plan history</Link><Link className="v2-text-link" href={`/v2/library/plans/${templateId}`}>View plan</Link></div>
    {history.template.isArchived && <p className="v2-chip">Archived plan</p>}
    <SessionList sessions={history.workouts.items} recommendations={recommendations} />
    <HistoryPagination {...history.workouts} basePath={`/v2/history/plans/${templateId}`} />
  </HistoryFrame>;
}

export async function ExerciseHistoryScreen({ exerciseId, page }: { exerciseId: string; page: number }) {
  const { user } = await getV2Context();
  if (!user) redirect("/login");
  const history = await getExerciseHistory({ userId: user.id, exerciseId, page });
  if (!history) notFound();
  const recommendations = await getHistoryRecommendations(user.id, history.performances.items.filter(item => item.sessionStatus === "completed").map(item => item.sessionExerciseId));
  return <HistoryFrame view="exercises" title={history.exerciseName}>
    <Link className="v2-text-link" href="/v2/history/exercises">← All exercise history</Link>
    {!history.performances.items.length ? <HistoryEmpty message="No logged working sets on this page. Try a newer page if available." /> : <ol className="v2-history-stack">{history.performances.items.map(performance => <li key={performance.sessionExerciseId}>
      <Card className="v2-history-session">
        <div className="v2-section-heading"><h2>{performance.templateName}</h2><span className="v2-chip">{performance.sessionStatus === "completed" ? "Completed" : "Abandoned"}</span></div>
        <HistoryDate value={performance.startedAt} />
        <HistorySets sets={performance.sets} />
        {performance.sessionStatus === "completed" ? <HistoryDecision recommendation={recommendations[performance.sessionExerciseId]} unit={performance.sets[0]?.weightUnit} /> : <p className="v2-muted">Abandoned session · no new progression decision.</p>}
        <div className="v2-actions"><Link className="v2-text-link" href={`/v2/history/sessions/${performance.workoutSessionId}`}>View session</Link>
          {performance.templateId && <Link className="v2-text-link" href={`/v2/history/plans/${performance.templateId}`}>Plan history</Link>}
        </div>
      </Card>
    </li>)}</ol>}
    <HistoryPagination {...history.performances} basePath={`/v2/history/exercises/${exerciseId}`} />
  </HistoryFrame>;
}

export async function SessionHistoryScreen({ sessionId }: { sessionId: string }) {
  const { user } = await getV2Context();
  if (!user) redirect("/login");
  const workout = await getWorkoutSession({ userId: user.id, sessionId });
  if (!workout) notFound();
  if (workout.status === "in_progress") redirect(`/v2/workouts/${sessionId}`);
  return <WorkoutResults workout={workout} fromHistory />;
}
