import {
  calculateEpleyOneRepMax,
  calculateSetVolume,
  calculateTotalVolume,
} from "./strength";

describe("strength metrics", () => {
  describe("calculateSetVolume", () => {
    it("multiplies weight by reps", () => {
      expect(calculateSetVolume({ weight: 135, reps: 8 })).toBe(1080);
    });

    it("returns zero when reps are zero", () => {
      expect(calculateSetVolume({ weight: 135, reps: 0 })).toBe(0);
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
  });

  describe("calculateEpleyOneRepMax", () => {
    it("calculates Epley estimated one-rep max", () => {
      expect(calculateEpleyOneRepMax({ weight: 100, reps: 10 })).toBeCloseTo(
        133.333,
        3,
      );
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
  });
});
