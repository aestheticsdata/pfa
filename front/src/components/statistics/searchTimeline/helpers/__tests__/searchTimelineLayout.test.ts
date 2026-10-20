import { barLayout, bucketAt, cadenceDays } from "@components/statistics/searchTimeline/helpers/searchTimelineLayout";
import { describe, expect, it } from "vitest";

const rect = { left: 100, width: 400 } as DOMRect;

describe("barLayout", () => {
  it("clamps the bar between 1.3 and 6 px of a width-proportional slot", () => {
    expect(barLayout(600, 365)).toEqual({ slot: 600 / 365, barWidth: 1.3 });
    expect(barLayout(600, 30)).toEqual({ slot: 20, barWidth: 6 });
    expect(barLayout(600, 0)).toEqual({ slot: 0, barWidth: 1.3 });
  });
});

describe("bucketAt", () => {
  it("maps the cursor x to a bucket, clamped to the series", () => {
    expect(bucketAt(100, rect, 10)).toBe(0);
    expect(bucketAt(299, rect, 10)).toBe(4);
    expect(bucketAt(50, rect, 10)).toBe(0);
    expect(bucketAt(900, rect, 10)).toBe(9);
  });
});

describe("cadenceDays", () => {
  it("spreads the window span over the matches", () => {
    expect(cadenceDays({ from: "2026-01-01", to: "2026-01-31" }, 3)).toBe(10);
    expect(cadenceDays({ from: "2026-01-01", to: "2026-01-31" }, 0)).toBe(0);
  });
});
