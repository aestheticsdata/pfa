import { OVERSPEND_DANGER_RATIO } from "@components/spendings/helpers/overspendLevel";
import { bulletSegments, scaleFrac } from "@components/statistics/helpers/weekdayBullet";

describe("scaleFrac", () => {
  it("maps an amount to its 0–1 position on the scale", () => {
    expect(scaleFrac(100, 400)).toBe(0.25);
    expect(scaleFrac(0, 400)).toBe(0);
  });

  it("clamps outside 0–1 and guards a zero/negative scale", () => {
    expect(scaleFrac(500, 400)).toBe(1);
    expect(scaleFrac(-10, 400)).toBe(0);
    expect(scaleFrac(100, 0)).toBe(0);
  });
});

describe("bulletSegments", () => {
  // budget 100 → danger 200; scale 400 keeps the fractions round.
  const budget = 100;
  const scaleMax = 400;

  it("stays green-only under the budget", () => {
    expect(bulletSegments(50, budget, scaleMax)).toEqual([{ level: "normal", start: 0, width: 0.125 }]);
  });

  it("stays green-only at exactly the budget (boundary is not over)", () => {
    expect(bulletSegments(budget, budget, scaleMax)).toEqual([{ level: "normal", start: 0, width: 0.25 }]);
  });

  it("adds an orange zone above the budget, green base at full width", () => {
    expect(bulletSegments(150, budget, scaleMax)).toEqual([
      { level: "normal", start: 0, width: 0.25 },
      { level: "warn", start: 0.25, width: 0.125 },
    ]);
  });

  it("caps orange at 2×budget without a red zone at exactly the danger multiple", () => {
    expect(bulletSegments(budget * OVERSPEND_DANGER_RATIO, budget, scaleMax)).toEqual([
      { level: "normal", start: 0, width: 0.25 },
      { level: "warn", start: 0.25, width: 0.25 },
    ]);
  });

  it("adds a red zone past 2×budget, with green and orange at full width", () => {
    expect(bulletSegments(300, budget, scaleMax)).toEqual([
      { level: "normal", start: 0, width: 0.25 },
      { level: "warn", start: 0.25, width: 0.25 },
      { level: "danger", start: 0.5, width: 0.25 },
    ]);
  });

  it("emits an empty green zone for a zero-spend weekday", () => {
    expect(bulletSegments(0, budget, scaleMax)).toEqual([{ level: "normal", start: 0, width: 0 }]);
  });
});
