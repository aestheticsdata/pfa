import { SLICE_SECONDS } from "@lib/panel/slices";
import { codesRows, figure, latencyRows, sliceActionRows } from "@lib/panel/tooltipRows";
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

describe("figure", () => {
  it("reads a rate in burst and a count in a 15-min slice", () => {
    expect(figure(1200, SLICE_SECONDS.burst)).toBe("1,200/min");
    expect(figure(1200, SLICE_SECONDS.day)).toBe("1,200");
  });
});

describe("latencyRows", () => {
  it("shows no latency for a slice without requests", () => {
    const rows = latencyRows(point({ p50: 12 }), SLICE_SECONDS.day);
    expect(rows.map((row) => row.value)).toEqual(["—", "—", "0"]);
  });
});

describe("codesRows", () => {
  it("flags 5xx only when there are some", () => {
    expect(codesRows(point({}), SLICE_SECONDS.day)[2]?.bad).toBe(false);
    expect(codesRows(point({ codes5xx: 2 }), SLICE_SECONDS.day)[2]?.bad).toBe(true);
  });
});

describe("sliceActionRows", () => {
  it("lists the actions that ran busiest first, then the unattributed rest and the errors", () => {
    const rows = sliceActionRows({
      point: point({ actions: 10, errors: 1, byAction: { "dashboard.view": 2, "spending.add": 5 } }),
      actionNames: ["dashboard.view", "spending.add", "receipt.upload"],
    });
    expect(rows.map((row) => [row.label, row.value])).toEqual([
      ["spending.add", "5"],
      ["dashboard.view", "2"],
      ["other", "3"],
      ["errors", "1"],
    ]);
  });
});
