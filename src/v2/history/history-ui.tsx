import Link from "next/link";
import { LocalDateTime } from "@/features/workouts/components/local-date-time";
import type { WorkoutSet } from "@/features/workouts/types";
import { poundsToKilograms } from "@/lib/units/weight";
import { Button, ButtonLink, Card, PageHeader } from "../ui/primitives";
import type { HistoryDecisionProps, HistoryFrameProps, HistoryPaginationProps } from "./types";

export function HistoryFrame({ view, title, children }: HistoryFrameProps) {
  return <>
    <PageHeader eyebrow="History" title={title} description="Your sessions, your numbers, and the work behind them." />
    <nav className="v2-tabs" aria-label="History views">
      {([['sessions', '/v2/history', 'Sessions'], ['plans', '/v2/history/plans', 'Plans'], ['exercises', '/v2/history/exercises', 'Exercises']] as const).map(([key, href, label]) => <Link key={key} href={href} aria-current={view === key ? "page" : undefined}>{label}</Link>)}
    </nav>
    {children}
  </>;
}
export function HistoryPagination({ page, hasPreviousPage, hasNextPage, basePath }: HistoryPaginationProps) {
  return <nav className="v2-actions v2-history-pagination" aria-label="History pages">
    {hasPreviousPage
      ? <ButtonLink variant="secondary" href={`${basePath}?page=${page - 1}`}><span aria-hidden="true">←</span> Previous</ButtonLink>
      : <Button variant="secondary" disabled><span aria-hidden="true">←</span> Previous</Button>}
    <span className="v2-muted">Page {page}</span>
    {hasNextPage
      ? <ButtonLink variant="secondary" href={`${basePath}?page=${page + 1}`}>Next <span aria-hidden="true">→</span></ButtonLink>
      : <Button variant="secondary" disabled>Next <span aria-hidden="true">→</span></Button>}
  </nav>;
}
export function HistoryEmpty({ message }: { message: string }) {
  return <Card><h2>No history to show</h2><p className="v2-muted">{message}</p><ButtonLink variant="secondary" href="/v2/library">Browse plans</ButtonLink></Card>;
}
export function HistoryDate({ value }: { value: string }) {
  return <LocalDateTime value={value} dateStyle="medium" />;
}
export function HistorySets({ sets }: { sets: WorkoutSet[] }) {
  if (!sets.length) return <p className="v2-muted">No working sets logged.</p>;
  return <ol className="v2-history-sets">{sets.map(set => <li key={set.id}>
    <span className="v2-muted">Set {set.position}</span><strong>{set.weightValue} {set.weightUnit} × {set.reps}</strong>
    {set.rir !== null && <span>{set.rir >= 3 ? "3+" : set.rir} RIR</span>}
  </li>)}</ol>;
}
export function HistoryDecision({ recommendation, unit = "lb" }: HistoryDecisionProps) {
  if (!recommendation) return <p className="v2-muted">No recorded progression decision.</p>;
  const labels = { increase: "Increase", maintain: "Maintain", reduce: "Reduce", review: "Review" };
  const weight = recommendation.recommendedWeightLbs;
  return <aside className="v2-history-decision" aria-label="Recorded progression decision">
    <p className="v2-eyebrow">Recorded next-session decision</p>
    <p><strong>{labels[recommendation.action]}{recommendation.action !== "review" && weight !== null && Number.isFinite(weight) ? ` · ${new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 }).format(unit === "kg" ? poundsToKilograms(weight) : weight)} ${unit}` : ""}</strong></p>
    <p>{recommendation.explanation}</p>
  </aside>;
}
