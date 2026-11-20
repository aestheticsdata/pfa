import { areaPath, average, linearScale, linePath, nearestIndex, toPoints } from "@charts/lib/scale";

const BOX = { left: 0, top: 0, width: 100, height: 50 };

describe("chart scale helpers", () => {
  it("maps a domain onto a range, a flat domain onto its start", () => {
    expect(linearScale([0, 10], [0, 100])(5)).toBe(50);
    expect(linearScale([0, 10], [50, 0])(10)).toBe(0);
    expect(linearScale([3, 3], [7, 9])(3)).toBe(7);
  });

  it("spreads the days across the width, the largest value at the top", () => {
    const points = toPoints([0, 50, 100], BOX);
    expect(points).toEqual([
      { x: 0, y: 50 },
      { x: 50, y: 25 },
      { x: 100, y: 0 },
    ]);
  });

  it("keeps a month with nothing spent on the baseline", () => {
    expect(toPoints([0, 0], BOX).every((point) => point.y === 50)).toBe(true);
  });

  it("builds the line and closes the area down to the baseline", () => {
    const points = toPoints([0, 100], BOX);
    expect(linePath(points)).toBe("M0 50 L100 0");
    expect(areaPath(points, 50)).toBe("M0 50 L100 0 L100 50 L0 50 Z");
    expect(areaPath([], 50)).toBe("");
  });

  it("averages, and finds the point under a finger", () => {
    expect(average([10, 20, 30])).toBe(20);
    expect(average([])).toBe(0);
    expect(nearestIndex(toPoints([1, 2, 3, 4, 5], BOX), 60)).toBe(2);
  });
});
