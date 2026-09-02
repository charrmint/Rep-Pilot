import { describe, expect, it } from "vitest";

import { validateWorkoutSetInput } from "./workout-validation";

describe("validateWorkoutSetInput", () => {
  it("normalizes a valid set weight", () => {
    expect(
      validateWorkoutSetInput({
        sessionExerciseId: "session-exercise-id",
        position: 1,
        reps: 8,
        weightValue: 100,
        weightUnit: "kg",
      }),
    ).toEqual({
      sessionExerciseId: "session-exercise-id",
      position: 1,
      reps: 8,
      weightValue: 100,
      weightUnit: "kg",
      rir: null,
      normalizedWeightLbs: 220,
    });
  });

  it("allows a zero-rep attempt and zero weight", () => {
    expect(
      validateWorkoutSetInput({
        sessionExerciseId: "session-exercise-id",
        position: 1,
        reps: 0,
        weightValue: 0,
        weightUnit: "lb",
      }),
    ).toMatchObject({ reps: 0, normalizedWeightLbs: 0 });
  });

  it("rejects invalid positions", () => {
    expect(() =>
      validateWorkoutSetInput({
        sessionExerciseId: "session-exercise-id",
        position: 0,
        reps: 8,
        weightValue: 135,
        weightUnit: "lb",
      }),
    ).toThrow("Set position must be a positive whole number.");
  });

  it("rejects fractional reps", () => {
    expect(() =>
      validateWorkoutSetInput({
        sessionExerciseId: "session-exercise-id",
        position: 1,
        reps: 8.5,
        weightValue: 135,
        weightUnit: "lb",
      }),
    ).toThrow("Reps must be a non-negative whole number.");
  });

  it("rejects negative weights", () => {
    expect(() =>
      validateWorkoutSetInput({
        sessionExerciseId: "session-exercise-id",
        position: 1,
        reps: 8,
        weightValue: -1,
        weightUnit: "lb",
      }),
    ).toThrow("Weight must be a non-negative number.");
  });

  it("accepts an optional valid RIR value", () => {
    expect(
      validateWorkoutSetInput({
        sessionExerciseId: "session-exercise-id",
        position: 1,
        reps: 8,
        weightValue: 135,
        weightUnit: "lb",
        rir: 2,
      }),
    ).toMatchObject({ rir: 2 });
  });

  it("rejects RIR outside the supported range", () => {
    expect(() =>
      validateWorkoutSetInput({
        sessionExerciseId: "session-exercise-id",
        position: 1,
        reps: 8,
        weightValue: 135,
        weightUnit: "lb",
        rir: 11,
      }),
    ).toThrow("RIR must be a whole number between 0 and 10.");
  });
});
