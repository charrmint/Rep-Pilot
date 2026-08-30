import { describe, expect, it } from "vitest";

import {
  normalizeCustomExerciseName,
  validateCustomExerciseName,
} from "./exercise-validation";

describe("normalizeCustomExerciseName", () => {
  it("trims and collapses internal whitespace", () => {
    expect(normalizeCustomExerciseName("  Cable   Low\tRow  ")).toBe(
      "Cable Low Row",
    );
  });
});

describe("validateCustomExerciseName", () => {
  it("returns a normalized valid name", () => {
    expect(validateCustomExerciseName("  dumbbell press  ")).toBe(
      "dumbbell press",
    );
  });

  it("rejects blank names", () => {
    expect(() => validateCustomExerciseName(" \n\t ")).toThrow(
      "Exercise name is required.",
    );
  });

  it("rejects names longer than the UI limit", () => {
    expect(() => validateCustomExerciseName("a".repeat(81))).toThrow(
      "Exercise name must be 80 characters or fewer.",
    );
  });
});
