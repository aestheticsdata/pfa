import { angleFromCenter, annularSectorPath, polarToCartesian } from "@lib/dataviz/arcPaths";
import { describe, expect, it } from "vitest";

// All numbers a path string lands on, in order (handles decimals + sci notation).
const numsOf = (d: string): number[] => (d.match(/-?\d+(?:\.\d+)?(?:e-?\d+)?/g) ?? []).map(Number);

describe("polarToCartesian", () => {
  it("measures clockwise from 12 o'clock (0° = top, 90° = right, 180° = bottom)", () => {
    const top = polarToCartesian(50, 50, 40, 0);
    expect(top.x).toBeCloseTo(50);
    expect(top.y).toBeCloseTo(10);

    const right = polarToCartesian(50, 50, 40, 90);
    expect(right.x).toBeCloseTo(90);
    expect(right.y).toBeCloseTo(50);

    const bottom = polarToCartesian(50, 50, 40, 180);
    expect(bottom.x).toBeCloseTo(50);
    expect(bottom.y).toBeCloseTo(90);
  });
});

describe("angleFromCenter", () => {
  it("inverts polarToCartesian: clockwise from 12 o'clock, normalized to [0, 360)", () => {
    expect(angleFromCenter(0, -1)).toBeCloseTo(0); // up
    expect(angleFromCenter(1, 0)).toBeCloseTo(90); // right
    expect(angleFromCenter(0, 1)).toBeCloseTo(180); // down
    expect(angleFromCenter(-1, 0)).toBeCloseTo(270); // left (normalized, not -90)
  });

  it("round-trips a point produced by polarToCartesian", () => {
    const p = polarToCartesian(50, 50, 40, 123);
    expect(angleFromCenter(p.x - 50, p.y - 50)).toBeCloseTo(123);
  });
});

describe("annularSectorPath", () => {
  it("traces a closed band: two arcs, one cap line, closed with Z", () => {
    const d = annularSectorPath(50, 50, 40, 46, 0, 90);
    expect(d.startsWith("M ")).toBe(true);
    expect(d.trim().endsWith("Z")).toBe(true);
    expect(d.match(/A/g)).toHaveLength(2);
    expect(d.match(/L/g)).toHaveLength(1);
  });

  it("starts at the outer radius on the start angle", () => {
    const d = annularSectorPath(50, 50, 40, 46, 0, 90);
    const start = polarToCartesian(50, 50, 46, 0);
    const nums = numsOf(d);
    expect(nums[0]).toBeCloseTo(start.x);
    expect(nums[1]).toBeCloseTo(start.y);
  });

  it("runs the outer arc clockwise (sweep 1) and the inner arc back (sweep 0)", () => {
    const d = annularSectorPath(50, 50, 40, 46, 0, 90);
    expect(d).toMatch(/A 46 46 0 0 1 /); // outer, rOuter = 46
    expect(d).toMatch(/A 40 40 0 0 0 /); // inner, rInner = 40
  });

  it("picks the small-arc flag up to 180° and the large-arc flag beyond", () => {
    expect(annularSectorPath(50, 50, 40, 46, 0, 90)).toMatch(/A 46 46 0 0 1 /); // 90° → small
    expect(annularSectorPath(50, 50, 40, 46, 0, 270)).toMatch(/A 46 46 0 1 1 /); // 270° → large (outer)
    expect(annularSectorPath(50, 50, 40, 46, 0, 270)).toMatch(/A 40 40 0 1 0 /); // 270° → large (inner)
  });
});
