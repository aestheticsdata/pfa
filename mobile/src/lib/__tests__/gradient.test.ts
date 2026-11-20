import { gradientPoints } from "@lib/gradient";
import { clampRatio } from "@lib/ratio";

describe("gradientPoints", () => {
  it("maps CSS angles onto start / end points", () => {
    expect(gradientPoints(90)).toEqual({ start: { x: 0, y: 0.5 }, end: { x: 1, y: 0.5 } });
    expect(gradientPoints(180)).toEqual({ start: { x: 0.5, y: 0 }, end: { x: 0.5, y: 1 } });
    expect(gradientPoints(0)).toEqual({ start: { x: 0.5, y: 1 }, end: { x: 0.5, y: 0 } });
  });

  it("runs a 135° glow from the top left to the bottom right", () => {
    const { start, end } = gradientPoints(135);
    expect(start.x).toBeLessThan(end.x);
    expect(start.y).toBeLessThan(end.y);
  });
});

describe("clampRatio", () => {
  it.each([
    [0.4, 0.4],
    [-1, 0],
    [3, 1],
    [Number.NaN, 0],
    [Number.POSITIVE_INFINITY, 0],
  ])("%p → %p", (ratio, expected) => {
    expect(clampRatio(ratio)).toBe(expected);
  });
});
