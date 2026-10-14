import { hasActivity, SLICE_SECONDS, sliceCounts, sliceSpan } from "@lib/panel/slices";
import { describe, expect, it } from "vitest";

import type { ActivityPoint } from "@contracts/interfaces/panelTypes";

const point = (fields: Partial<ActivityPoint>): ActivityPoint => ({
  at: "2026-10-14T13:15:00.000Z",
  actions: 0,
  errors: 0,
  byAction: {},
  errorsByAction: {},
  byBot: {},
  requests: 0,
  p50: 0,
  p95: 0,
  codes2xx: 0,
  codes4xx: 0,
  codes5xx: 0,
  live: 0,
  target: 0,
  throttled: false,
  ...fields,
});

describe("sliceSpan", () => {
  it("reads a 15-min slice as a range and a 1-second one as a time", () => {
    expect(sliceSpan("2026-10-14T13:15:00.000Z", SLICE_SECONDS.day)).toMatch(/^\d\d:\d\d – \d\d:\d\d$/);
    expect(sliceSpan("2026-10-14T13:15:00.000Z", SLICE_SECONDS.burst)).toMatch(/^\d\d:\d\d:\d\d$/);
  });
});

describe("hasActivity", () => {
  it("is false for a slice where nothing ran, whatever the population", () => {
    expect(hasActivity(point({ live: 40, target: 40 }))).toBe(false);
  });

  it("is true as soon as an action, an error or a request was counted", () => {
    expect(hasActivity(point({ actions: 1 }))).toBe(true);
    expect(hasActivity(point({ errors: 1 }))).toBe(true);
    expect(hasActivity(point({ requests: 1 }))).toBe(true);
  });
});

describe("sliceCounts", () => {
  it("divides a burst slice's per-minute rates back to its counts", () => {
    const counted = sliceCounts(point({ actions: 120, codes2xx: 180, live: 12 }), SLICE_SECONDS.burst);
    expect(counted.actions).toBe(2);
    expect(counted.codes2xx).toBe(3);
    expect(counted.live).toBe(12);
  });

  it("leaves a 15-min slice alone", () => {
    const slice = point({ actions: 120 });
    expect(sliceCounts(slice, SLICE_SECONDS.day)).toBe(slice);
  });
});
