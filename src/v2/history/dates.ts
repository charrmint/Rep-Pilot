import type { WorkoutHistorySession } from "@/features/workouts/types";
import type { HistoryMonth } from "./types";

function _calendarDate(value: string | number, timeZone: string): Date {
  const parts = new Intl.DateTimeFormat("en-US", { timeZone, year: "numeric", month: "numeric", day: "numeric" }).formatToParts(new Date(value));
  const _value = (type: string) => Number(parts.find(part => part.type === type)?.value);
  return new Date(Date.UTC(_value("year"), _value("month") - 1, _value("day")));
}

export function groupHistoryMonths(sessions: WorkoutHistorySession[], timeZone: string): HistoryMonth[] {
  const groups = new Map<string, HistoryMonth>();
  for (const session of [...sessions].sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime())) {
    const date = _calendarDate(session.startedAt, timeZone);
    const key = date.toISOString().slice(0, 7);
    if (!groups.has(key)) groups.set(key, {
      key,
      label: new Intl.DateTimeFormat("en-US", { timeZone: "UTC", month: "long", year: "numeric" }).format(date),
      sessions: [],
    });
    groups.get(key)!.sessions.push(session);
  }
  return [...groups.values()];
}

export function formatHistoryDate(value: string, now: number, timeZone: string): string {
  const date = _calendarDate(value, timeZone);
  const today = _calendarDate(now, timeZone);
  const daysAgo = (today.getTime() - date.getTime()) / 86_400_000;
  const prefix = daysAgo === 0 ? "Today" : daysAgo === 1 ? "Yesterday" : new Intl.DateTimeFormat("en-US", { timeZone: "UTC", weekday: "short" }).format(date);
  const label = new Intl.DateTimeFormat("en-US", { timeZone: "UTC", month: "short", day: "numeric" }).format(date);
  return `${prefix} · ${label}`;
}
