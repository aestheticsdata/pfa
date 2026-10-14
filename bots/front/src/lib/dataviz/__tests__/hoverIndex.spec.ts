import { columnAt, pointAt } from "@lib/dataviz/hoverIndex";
import { describe, expect, it } from "vitest";

describe("columnAt", () => {
  it("finds the column under the pointer", () => {
    expect(columnAt({ offset: 0, width: 100, count: 4 })).toBe(0);
    expect(columnAt({ offset: 26, width: 100, count: 4 })).toBe(1);
    expect(columnAt({ offset: 99.9, width: 100, count: 4 })).toBe(3);
  });

  it("clamps outside the plot", () => {
    expect(columnAt({ offset: -5, width: 100, count: 4 })).toBe(0);
    expect(columnAt({ offset: 100, width: 100, count: 4 })).toBe(3);
  });

  it("has nothing to point at without columns or width", () => {
    expect(columnAt({ offset: 10, width: 100, count: 0 })).toBe(-1);
    expect(columnAt({ offset: 10, width: 0, count: 4 })).toBe(-1);
  });
});

describe("pointAt", () => {
  it("snaps to the nearest point, the first and last on the edges", () => {
    expect(pointAt({ offset: 0, width: 100, count: 5 })).toBe(0);
    expect(pointAt({ offset: 20, width: 100, count: 5 })).toBe(1);
    expect(pointAt({ offset: 100, width: 100, count: 5 })).toBe(4);
  });

  it("has one answer for one point", () => {
    expect(pointAt({ offset: 70, width: 100, count: 1 })).toBe(0);
  });
});
