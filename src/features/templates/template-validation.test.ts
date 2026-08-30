import { describe, expect, it } from "vitest";

import {
  normalizeWorkoutTemplateName,
  validateWorkoutTemplateName,
} from "./template-validation";

describe("normalizeWorkoutTemplateName", () => {
  it("trims and collapses internal whitespace", () => {
    expect(normalizeWorkoutTemplateName("  Upper   Body\tA  ")).toBe(
      "Upper Body A",
    );
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
