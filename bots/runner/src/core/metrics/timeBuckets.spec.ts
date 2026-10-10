import { percentile, TimeBuckets } from "@core/metrics/timeBuckets";
import { describe, expect, it } from "vitest";

describe("TimeBuckets", () => {
  it("writes to the current slice, keeps empty slices, and drops what left the window", () => {
    let now = 10_000;
    const window = new TimeBuckets({ bucketMs: 2000, size: 3, make: () => ({ n: 0 }), clock: () => now });
    window.current().n += 1;
    now += 2000;
    window.current().n += 5;
    expect(window.read().map((slice) => slice.bucket.n)).toEqual([0, 1, 5]);
    now += 4000;
    expect(window.read().map((slice) => slice.bucket.n)).toEqual([5, 0, 0]);
    now += 60_000;
    expect(window.read().map((slice) => slice.bucket.n)).toEqual([0, 0, 0]);
    expect(window.read().at(-1)?.at).toBe(Math.floor(now / 2000) * 2000);
  });

  it("reads percentiles", () => {
    expect(percentile([], 0.5)).toBe(0);
    expect(percentile([30, 10, 20, 40], 0.5)).toBe(30);
    expect(percentile([1, 2, 3, 4, 5, 6, 7, 8, 9, 100], 0.95)).toBe(100);
  });
});
