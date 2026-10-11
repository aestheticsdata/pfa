import formatMeasure from "@components/prices/helpers/formatMeasure";

const units = { g: "g", kg: "kg", ml: "ml", cl: "cl", l: "L" };

describe("formatMeasure", () => {
  it.each([
    [{ quantity: 4, size: 1, sizeUnit: "l" as const }, "4 × 1 L"],
    [{ quantity: 1, size: 250, sizeUnit: "g" as const }, "250 g"],
    [{ quantity: 1, size: 0.512, sizeUnit: "kg" as const }, "0,512 kg"],
    [{ quantity: 3, size: null, sizeUnit: null }, "× 3"],
    [{ quantity: 1, size: null, sizeUnit: null }, ""],
  ])("%j → %s", (measure, expected) => {
    expect(formatMeasure(measure, units)).toBe(expected);
  });
});
