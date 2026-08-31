import {
  readNumberFormValue,
  readStringFormValue,
  readWeightUnitFormValue,
} from "./form-values";

describe("form value readers", () => {
  it("reads string values", () => {
    const formData = new FormData();
    formData.set("name", "Upper A");

    expect(readStringFormValue(formData, "name")).toBe("Upper A");
  });

  it("returns an empty string for missing string values", () => {
    expect(readStringFormValue(new FormData(), "name")).toBe("");
  });

  it("reads finite number values", () => {
    const formData = new FormData();
    formData.set("sets", "3");

    expect(readNumberFormValue(formData, "sets")).toBe(3);
  });

  it("returns NaN for invalid number values", () => {
    const formData = new FormData();
    formData.set("sets", "heavy");

    expect(readNumberFormValue(formData, "sets")).toBeNaN();
  });

  it("reads supported weight units", () => {
    const formData = new FormData();
    formData.set("unit", "lb");

    expect(readWeightUnitFormValue(formData, "unit")).toBe("lb");

    formData.set("unit", "kg");

    expect(readWeightUnitFormValue(formData, "unit")).toBe("kg");
  });

  it("rejects unsupported weight units", () => {
    const formData = new FormData();
    formData.set("unit", "stone");

    expect(() => readWeightUnitFormValue(formData, "unit")).toThrow(
      "Weight unit must be lb or kg.",
    );
  });
});
