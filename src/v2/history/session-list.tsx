"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";
import { getWorkoutDurationLabel } from "@/features/workouts/workout-history";
import { ButtonLink, Card } from "../ui/primitives";
import { HistoryDecision, HistoryEmpty, HistorySets } from "./history-ui";
import { HistoryDate } from "./history-date";
import { groupHistoryMonths } from "./dates";
import type { SessionListProps } from "./types";

function _subscribe() { return () => undefined; }
function _localZone() { return Intl.DateTimeFormat().resolvedOptions().timeZone; }
function _serverZone() { return "UTC"; }

export function SessionList({ sessions, recommendations }: SessionListProps) {
  const zone = useSyncExternalStore(_subscribe, _localZone, _serverZone);
  if (!sessions.length) return <HistoryEmpty message="No completed or abandoned sessions on this page. Start a workout, or return to a newer page." />;
  return <div className="v2-history-stack">
    {groupHistoryMonths(sessions, zone).map(month => <section key={month.key} className="v2-history-stack" aria-label={month.label}>
      <h2>{month.label}</h2>
      <ol className="v2-history-stack">{month.sessions.map(session => <li key={session.id}>
        <Card className="v2-history-session">
          <div className="v2-section-heading"><h3>{session.templateName}</h3><span className="v2-chip">{session.status === "completed" ? "Completed" : "Abandoned"}</span></div>
          <p className="v2-muted"><HistoryDate value={session.startedAt} />{session.status === "completed" && getWorkoutDurationLabel(session) ? ` · ${getWorkoutDurationLabel(session)}` : ""}</p>
          <p>{session.exercises.reduce((sum, exercise) => sum + exercise.sets.length, 0)} working sets · {session.exercises.filter(exercise => exercise.sets.length).length} exercises logged</p>
          <details className="v2-history-details"><summary>View exercises and decisions</summary>
            {session.exercises.length === 0 && <p className="v2-muted">No exercises recorded.</p>}
            {session.exercises.map(exercise => <section key={exercise.sessionExerciseId} className="v2-history-exercise">
              <h4><Link className="v2-text-link" href={`/v2/history/exercises/${exercise.exerciseId}`}>{exercise.exerciseName}</Link></h4>
              <HistorySets sets={exercise.sets} />
              {session.status === "completed" ? <HistoryDecision recommendation={recommendations[exercise.sessionExerciseId]} unit={exercise.sets[0]?.weightUnit} /> : <p className="v2-muted">Abandoned session · no new progression decision.</p>}
            </section>)}
          </details>
          <div className="v2-actions"><ButtonLink variant="secondary" href={`/v2/history/sessions/${session.id}`}>View session</ButtonLink>
            {session.templateId && <Link className="v2-text-link" href={`/v2/history/plans/${session.templateId}`}>Plan history</Link>}
          </div>
        </Card>
      </li>)}</ol>
    </section>)}
  </div>;
}
