import { expect, it } from "vitest";
import type { WorkoutHistorySession } from "@/features/workouts/types";
import { formatHistoryDate, groupHistoryMonths } from "./dates";
function _session(id: string, startedAt: string): WorkoutHistorySession {
  return { id, startedAt, completedAt: null, templateId: null, templateName: "Saved plan", status: "completed", exercises: [] };
}
it("groups local calendar months in newest-first order without changing the input", () => {
  const sessions = [_session("september", "2026-10-01T06:59:00Z"), _session("october", "2026-10-01T07:00:00Z"), _session("later", "2026-10-02T07:00:00Z")];
  const groups = groupHistoryMonths(sessions, "America/Vancouver");
  expect(groups.map(group => [group.label, group.sessions.map(session => session.id)])).toEqual([["October 2026", ["later", "october"]], ["September 2026", ["september"]]]);
  expect(sessions[0].id).toBe("september");
});
it("separates years and handles an empty history", () => {
  expect(groupHistoryMonths([_session("new", "2027-01-01T08:00:00Z"), _session("old", "2027-01-01T07:59:00Z")], "America/Vancouver").map(group => group.key)).toEqual(["2027-01", "2026-12"]);
  expect(groupHistoryMonths([], "UTC")).toEqual([]);
});
it("shows relative dates by local calendar day rather than elapsed hours", () => {
  const now = Date.parse("2026-11-02T08:30:00Z");
  expect(formatHistoryDate("2026-11-02T08:00:00Z", now, "America/Vancouver")).toBe("Today · Nov 2");
  expect(formatHistoryDate("2026-11-01T07:30:00Z", now, "America/Vancouver")).toBe("Yesterday · Nov 1");
  expect(formatHistoryDate("2026-10-30T19:00:00Z", now, "America/Vancouver")).toBe("Fri · Oct 30");
});
