import { describe, expect, it } from "vitest";

import {
  normalizeWorkoutTemplateName,
  validateWorkoutTemplateExerciseConfig,
  validateWorkoutTemplateName,
} from "./template-validation";

describe("normalizeWorkoutTemplateName", () => {
  it("trims and collapses internal whitespace", () => {
    expect(normalizeWorkoutTemplateName("  Upper   Body\tA  ")).toBe(
      "Upper Body A",
    );
  });
});

describe("validateWorkoutTemplateExerciseConfig", () => {
  it("returns a normalized comparable weight for valid pound config", () => {
    expect(
      validateWorkoutTemplateExerciseConfig({
        targetSets: 3,
        minReps: 8,
        maxReps: 12,
        defaultWeightValue: 135,
        defaultWeightUnit: "lb",
        weightIncrementLbs: 5,
      }),
    ).toEqual({
      targetSets: 3,
      minReps: 8,
      maxReps: 12,
      defaultWeightValue: 135,
      defaultWeightUnit: "lb",
      defaultNormalizedWeightLbs: 135,
      weightIncrementLbs: 5,
    });
  });

  it("returns a normalized comparable weight for valid kilogram config", () => {
    expect(
      validateWorkoutTemplateExerciseConfig({
        targetSets: 3,
        minReps: 8,
        maxReps: 12,
        defaultWeightValue: 100,
        defaultWeightUnit: "kg",
        weightIncrementLbs: 5,
      }).defaultNormalizedWeightLbs,
    ).toBe(220);
  });

  it("rejects invalid set counts", () => {
    expect(() =>
      validateWorkoutTemplateExerciseConfig({
        targetSets: 0,
        minReps: 8,
        maxReps: 12,
        defaultWeightValue: 135,
        defaultWeightUnit: "lb",
        weightIncrementLbs: 5,
      }),
    ).toThrow("Target sets must be a positive whole number.");
  });

  it("rejects invalid rep ranges", () => {
    expect(() =>
      validateWorkoutTemplateExerciseConfig({
        targetSets: 3,
        minReps: 12,
        maxReps: 8,
        defaultWeightValue: 135,
        defaultWeightUnit: "lb",
        weightIncrementLbs: 5,
      }),
    ).toThrow("Maximum reps must be greater than or equal to minimum reps.");
  });

  it("rejects negative default weights", () => {
    expect(() =>
      validateWorkoutTemplateExerciseConfig({
        targetSets: 3,
        minReps: 8,
        maxReps: 12,
        defaultWeightValue: -1,
        defaultWeightUnit: "lb",
        weightIncrementLbs: 5,
      }),
    ).toThrow("Default weight cannot be negative.");
  });

  it("rejects non-positive weight increments", () => {
    expect(() =>
      validateWorkoutTemplateExerciseConfig({
        targetSets: 3,
        minReps: 8,
        maxReps: 12,
        defaultWeightValue: 135,
        defaultWeightUnit: "lb",
        weightIncrementLbs: 0,
      }),
    ).toThrow("Weight increment must be greater than zero.");
  });
});

describe("validateWorkoutTemplateName", () => {
  it("returns a normalized valid name", () => {
    expect(validateWorkoutTemplateName("  Lower A  ")).toBe("Lower A");
  });

  it("rejects blank names", () => {
    expect(() => validateWorkoutTemplateName(" \n\t ")).toThrow(
      "Template name is required.",
    );
  });

  it("rejects names longer than the UI limit", () => {
    expect(() => validateWorkoutTemplateName("a".repeat(81))).toThrow(
      "Template name must be 80 characters or fewer.",
    );
  });
});
