import { linePath, smoothPath } from "@lib/dataviz/linePaths";
import { describe, expect, it } from "vitest";

import type { LinePoint } from "@lib/dataviz/interfaces/dataVizTypes";

// Pull the final "x y" pair each path command lands on. For M/C commands the
// last two numbers of each segment are the on-curve anchor point, so this yields
// the ordered list of points the path actually passes through.
const anchorsOf = (d: string): LinePoint[] =>
  d
    .trim()
    .split(/(?=[MLC])/)
    .map((seg) =>
      seg
        .trim()
        .split(/[\s,]+/)
        .slice(1)
        .map(Number),
    )
    .map((nums) => ({ x: nums[nums.length - 2], y: nums[nums.length - 1] }));

describe("smoothPath", () => {
  it("returns an empty string for no points", () => {
    expect(smoothPath([])).toBe("");
  });

  it("degrades to a bare move for a single point", () => {
    expect(smoothPath([{ x: 10, y: 20 }])).toBe("M 10 20");
  });

  it("degrades to a straight line for two points (a curve needs 3+)", () => {
    const pts: LinePoint[] = [
      { x: 0, y: 0 },
      { x: 10, y: 4 },
    ];
    expect(smoothPath(pts)).toBe(linePath(pts));
    expect(smoothPath(pts)).not.toContain("C");
  });

  it("builds one cubic bézier per segment for 3+ points", () => {
    const pts: LinePoint[] = [
      { x: 0, y: 0 },
      { x: 10, y: 8 },
      { x: 20, y: 2 },
      { x: 30, y: 6 },
    ];
    const d = smoothPath(pts);
    expect(d.startsWith("M 0 0")).toBe(true);
    // n points → n-1 curve segments.
    expect(d.match(/C/g)).toHaveLength(pts.length - 1);
  });

  it("passes exactly through every input point", () => {
    const pts: LinePoint[] = [
      { x: 0, y: 5 },
      { x: 10, y: 8 },
      { x: 20, y: 2 },
      { x: 30, y: 6 },
      { x: 40, y: 1 },
    ];
    expect(anchorsOf(smoothPath(pts))).toEqual(pts);
  });

  it("keeps a horizontal series flat (all control points stay on the line)", () => {
    const pts: LinePoint[] = [
      { x: 0, y: 5 },
      { x: 10, y: 5 },
      { x: 20, y: 5 },
      { x: 30, y: 5 },
    ];
    // Strip the command letters, read the flat number list as (x, y) pairs: every
    // emitted y — anchors AND bézier control points — must be exactly 5, so the
    // smoothing adds no vertical wobble to an already-flat line.
    const coords = smoothPath(pts)
      .replace(/[MC]/g, " ")
      .trim()
      .split(/[\s,]+/)
      .map(Number);
    const yCoords = coords.filter((_, idx) => idx % 2 === 1);
    expect(yCoords.every((y) => y === 5)).toBe(true);
  });
});
