import {
  kilogramsToPounds,
  poundsToKilograms,
  roundToIncrement,
} from "./weight";

describe("weight unit helpers", () => {
  describe("poundsToKilograms", () => {
    it("converts pounds to kilograms", () => {
      expect(poundsToKilograms(220)).toBeCloseTo(100);
    });

    it("returns zero when pounds is zero", () => {
      expect(poundsToKilograms(0)).toBe(0);
    });
  });

  describe("kilogramsToPounds", () => {
    it("converts kilograms to pounds", () => {
      expect(kilogramsToPounds(100)).toBeCloseTo(220);
    });

    it("returns zero when kilograms is zero", () => {
      expect(kilogramsToPounds(0)).toBe(0);
    });
  });

  describe("roundToIncrement", () => {
    it("rounds to the nearest 5 lb increment", () => {
      expect(roundToIncrement(36, 5)).toBe(35);
      expect(roundToIncrement(38, 5)).toBe(40);
    });

    it("rounds to the nearest 2.5 increment", () => {
      expect(roundToIncrement(27.4, 2.5)).toBe(27.5);
      expect(roundToIncrement(27.6, 2.5)).toBe(27.5);
      expect(roundToIncrement(28.8, 2.5)).toBe(30);
    });

    it("rounds to the nearest 1.25 increment", () => {
      expect(roundToIncrement(26.8, 1.25)).toBe(26.25);
      expect(roundToIncrement(26.9, 1.25)).toBe(27.5);
    });

    it("trims floating-point artifacts to two decimal places", () => {
      expect(roundToIncrement(0.1 + 0.2, 0.1)).toBe(0.3);
    });

    it("throws when increment is zero or negative", () => {
      expect(() => roundToIncrement(35, 0)).toThrow(
        "Increment must be greater than zero.",
      );
      expect(() => roundToIncrement(35, -2.5)).toThrow(
        "Increment must be greater than zero.",
      );
    });
  });
});
