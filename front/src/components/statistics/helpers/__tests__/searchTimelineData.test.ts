import {
  fillTimeline,
  rollingCounts,
  rollingWindowBuckets,
  searchTimelineWindow,
  timelineTicks,
} from "@components/statistics/helpers/searchTimelineData";
import fr from "date-fns/locale/fr";

import type { SearchTimelineBucket } from "@src/schemas/stats";

const bucket = (date: string, total: number, count: number): SearchTimelineBucket => ({ date, total, count });

describe("searchTimelineWindow", () => {
  // 2026-07-21 is a Tuesday.
  const today = new Date(2026, 6, 21);

  it("spans one month / one year of days ending today, inclusive", () => {
    expect(searchTimelineWindow("month", today)).toEqual({ from: "2026-06-22", to: "2026-07-21" });
    expect(searchTimelineWindow("year", today)).toEqual({ from: "2025-07-22", to: "2026-07-21" });
  });

  it("snaps the 3-year window's start back to its Sunday so weekly buckets tile it", () => {
    const { from, to } = searchTimelineWindow("threeYears", today);
    // 2023-07-22 is a Saturday → back to Sunday 2023-07-16.
    expect(from).toBe("2023-07-16");
    expect(to).toBe("2026-07-21");
    expect(new Date(`${from}T00:00:00`).getDay()).toBe(0);
  });
});

describe("fillTimeline", () => {
  it("densifies daily buckets over the window, zero-filling the gaps", () => {
    const points = fillTimeline([bucket("2026-03-02", 12.5, 1)], "2026-03-01", "2026-03-04", "day");
    expect(points).toEqual([
      { date: "2026-03-01", total: 0, count: 0 },
      { date: "2026-03-02", total: 12.5, count: 1 },
      { date: "2026-03-03", total: 0, count: 0 },
      { date: "2026-03-04", total: 0, count: 0 },
    ]);
  });

  it("steps a week at a time for weekly buckets (Sunday keys)", () => {
    // 2026-03-01 is a Sunday.
    const points = fillTimeline([bucket("2026-03-08", 40, 2)], "2026-03-01", "2026-03-21", "week");
    expect(points.map((p) => p.date)).toEqual(["2026-03-01", "2026-03-08", "2026-03-15"]);
    expect(points[1]).toEqual({ date: "2026-03-08", total: 40, count: 2 });
  });
});

describe("rollingCounts", () => {
  it("sums the trailing window, truncated at the left edge", () => {
    const points = [1, 0, 2, 0, 1].map((count, i) => ({ date: `2026-03-0${i + 1}`, total: 0, count }));
    // Window of 3 buckets: [1, 1, 3, 2, 3].
    expect(rollingCounts(points, 3)).toEqual([1, 1, 3, 2, 3]);
  });

  it("maps ranges to their window in buckets (13 weekly buckets ≈ 90 days)", () => {
    expect(rollingWindowBuckets("month")).toBe(7);
    expect(rollingWindowBuckets("year")).toBe(30);
    expect(rollingWindowBuckets("threeYears")).toBe(13);
  });
});

describe("timelineTicks", () => {
  it("labels every 7th day on the month range", () => {
    const points = fillTimeline([], "2026-06-22", "2026-07-21", "day");
    const ticks = timelineTicks(points, "month", fr);
    expect(ticks.map((t) => t.index)).toEqual([0, 7, 14, 21, 28]);
    expect(ticks[0].label).toBe("22 juin");
  });

  it("labels the 1st of every other month on the year range", () => {
    const points = fillTimeline([], "2025-07-22", "2026-07-21", "day");
    const ticks = timelineTicks(points, "year", fr);
    // Even JS month indexes: sept., nov., janv., mars, mai, juil.
    expect(ticks.map((t) => t.label)).toEqual(["sept.", "nov.", "janv.", "mars", "mai", "juil."]);
  });

  it("labels the first week of each quarter on the 3-year range", () => {
    const points = fillTimeline([], "2026-01-04", "2026-12-27", "week");
    const ticks = timelineTicks(points, "threeYears", fr);
    expect(ticks.map((t) => t.label)).toEqual(["janv. 26", "avr. 26", "juil. 26", "oct. 26"]);
  });
});
