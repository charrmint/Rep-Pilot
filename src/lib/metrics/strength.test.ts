import {
  calculateEpleyOneRepMax,
  calculateSetVolume,
  calculateTotalVolume,
  isValidStrengthSet,
} from "./strength";

describe("strength metrics", () => {
  describe("calculateSetVolume", () => {
    it("multiplies weight by reps", () => {
      expect(calculateSetVolume({ weight: 135, reps: 8 })).toBe(1080);
    });

    it("returns zero when reps are zero", () => {
      expect(calculateSetVolume({ weight: 135, reps: 0 })).toBe(0);
    });

    it("returns zero for invalid strength sets", () => {
      expect(calculateSetVolume({ weight: 0, reps: 8 })).toBe(0);
      expect(calculateSetVolume({ weight: -10, reps: 8 })).toBe(0);
      expect(calculateSetVolume({ weight: Number.POSITIVE_INFINITY, reps: 8 })).toBe(
        0,
      );
      expect(calculateSetVolume({ weight: 100, reps: 7.5 })).toBe(0);
      expect(calculateSetVolume({ weight: 100, reps: Number.NaN })).toBe(0);
    });
  });

  describe("calculateTotalVolume", () => {
    it("sums volume across sets", () => {
      expect(
        calculateTotalVolume([
          { weight: 135, reps: 8 },
          { weight: 135, reps: 7 },
          { weight: 125, reps: 10 },
        ]),
      ).toBe(3275);
    });

    it("returns zero for an empty set list", () => {
      expect(calculateTotalVolume([])).toBe(0);
    });

    it("ignores invalid strength sets", () => {
      expect(
        calculateTotalVolume([
          { weight: 100, reps: 5 },
          { weight: 100, reps: 0 },
          { weight: -100, reps: 5 },
          { weight: Number.NaN, reps: 5 },
          { weight: 80, reps: 2.5 },
        ]),
      ).toBe(500);
    });
  });

  describe("calculateEpleyOneRepMax", () => {
    it("calculates Epley estimated one-rep max", () => {
      expect(calculateEpleyOneRepMax({ weight: 100, reps: 10 })).toBeCloseTo(
        133.333,
        3,
      );
    });

    it("uses the performed weight exactly for one-rep sets", () => {
      expect(calculateEpleyOneRepMax({ weight: 225, reps: 1 })).toBe(225);
    });

    it("allows estimates at the 12 rep threshold", () => {
      expect(calculateEpleyOneRepMax({ weight: 100, reps: 12 })).toBe(140);
    });

    it("does not estimate one-rep max above 12 reps", () => {
      expect(calculateEpleyOneRepMax({ weight: 100, reps: 13 })).toBeNull();
    });

    it("returns null for zero or negative reps", () => {
      expect(calculateEpleyOneRepMax({ weight: 100, reps: 0 })).toBeNull();
      expect(calculateEpleyOneRepMax({ weight: 100, reps: -1 })).toBeNull();
    });

    it("returns null for zero or negative weight", () => {
      expect(calculateEpleyOneRepMax({ weight: 0, reps: 8 })).toBeNull();
      expect(calculateEpleyOneRepMax({ weight: -10, reps: 8 })).toBeNull();
    });

    it("returns null for non-finite values and fractional reps", () => {
      expect(
        calculateEpleyOneRepMax({
          weight: Number.POSITIVE_INFINITY,
          reps: 8,
        }),
      ).toBeNull();
      expect(calculateEpleyOneRepMax({ weight: 100, reps: Number.NaN })).toBeNull();
      expect(calculateEpleyOneRepMax({ weight: 100, reps: 8.5 })).toBeNull();
    });
  });

  describe("isValidStrengthSet", () => {
    it("requires finite positive weight and finite positive integer reps", () => {
      expect(isValidStrengthSet({ weight: 100, reps: 8 })).toBe(true);
      expect(isValidStrengthSet({ weight: 0, reps: 8 })).toBe(false);
      expect(isValidStrengthSet({ weight: 100, reps: 0 })).toBe(false);
      expect(isValidStrengthSet({ weight: 100, reps: 8.5 })).toBe(false);
      expect(isValidStrengthSet({ weight: Number.NaN, reps: 8 })).toBe(false);
      expect(isValidStrengthSet({ weight: 100, reps: Number.POSITIVE_INFINITY })).toBe(
        false,
      );
    });
  });
});
