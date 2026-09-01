import { describe, expect, it } from "vitest";

import {
  createPaginatedHistory,
  getWorkoutDurationLabel,
  getWorkoutHistoryOffset,
  parseWorkoutHistoryPage,
} from "./workout-history";

describe("workout history pagination", () => {
  it("parses positive integer page values", () => {
    expect(parseWorkoutHistoryPage("3")).toBe(3);
    expect(parseWorkoutHistoryPage(["2", "4"])).toBe(2);
  });

  it("falls back to the first page for invalid values", () => {
    expect(parseWorkoutHistoryPage(undefined)).toBe(1);
    expect(parseWorkoutHistoryPage("0")).toBe(1);
    expect(parseWorkoutHistoryPage("2.5")).toBe(1);
  });

  it("uses one extra item to determine whether an older page exists", () => {
    expect(
      createPaginatedHistory({ items: [1, 2, 3, 4], page: 2, pageSize: 3 }),
    ).toEqual({
      items: [1, 2, 3],
      page: 2,
      hasPreviousPage: true,
      hasNextPage: true,
    });
    expect(getWorkoutHistoryOffset(3, 10)).toBe(20);
  });
});

describe("getWorkoutDurationLabel", () => {
  it("formats workout durations for history cards", () => {
    expect(
      getWorkoutDurationLabel({
        startedAt: "2026-09-01T16:00:00.000Z",
        completedAt: "2026-09-01T17:12:00.000Z",
      }),
    ).toBe("1 hr 12 min");
  });

  it("returns null when an abandoned workout has no completion time", () => {
    expect(
      getWorkoutDurationLabel({
        startedAt: "2026-09-01T16:00:00.000Z",
        completedAt: null,
      }),
    ).toBeNull();
  });
});
