import { bandFor, buildHeatmap } from "@components/statistics/helpers/heatmapData";

import type { ExceptionalItem } from "@src/schemas/exceptionals";
import type { DailyStat } from "@src/schemas/stats";

const day = (date: string, total: number, count = 1): DailyStat => ({ date, total, count });
const exc = (date: string, amount: number, label: string): ExceptionalItem =>
  ({ ID: date, userID: "u1", date, itemType: "exceptional", label, amount }) as ExceptionalItem;

describe("bandFor", () => {
  it("is lvl-0 at or below zero, or when there is no scale", () => {
    expect(bandFor(0, 100)).toBe("lvl-0");
    expect(bandFor(-5, 100)).toBe("lvl-0");
    expect(bandFor(50, 0)).toBe("lvl-0");
  });

  it("spreads positive amounts over four bands up to the max", () => {
    expect(bandFor(1, 100)).toBe("lvl-1");
    expect(bandFor(25, 100)).toBe("lvl-1");
    expect(bandFor(26, 100)).toBe("lvl-2");
    expect(bandFor(50, 100)).toBe("lvl-2");
    expect(bandFor(75, 100)).toBe("lvl-3");
    expect(bandFor(100, 100)).toBe("lvl-4");
  });
});

describe("buildHeatmap", () => {
  // Current year, only the first 10 days realized → a small, fully deterministic
  // window. Jan 1 2023 is a Sunday (Monday-based dow 6), which fixes the columns.
  const now = new Date(2023, 0, 10);
  const days = [day("2023-01-02", 100, 2), day("2023-01-03", 25)];
  const exceptionals = [exc("2023-01-05", 800, "ordinateur"), exc("2023-01-08", 300, "vélo")];

  it("derives the colour scale and busiest day from non-exceptional days only", () => {
    const { scaleMax, busiest } = buildHeatmap(2023, now, days, exceptionals);
    expect(scaleMax).toBe(100);
    expect(busiest).toEqual({ amount: 100, date: "2023-01-02" });
  });

  it("counts realized days by level, exceptional days overriding the spend band", () => {
    const { counts } = buildHeatmap(2023, now, days, exceptionals);
    expect(counts).toEqual({ "lvl-0": 6, "lvl-1": 1, "lvl-2": 0, "lvl-3": 0, "lvl-4": 1, "lvl-neg": 2 });
  });

  it("measures the longest run of consecutive sober (lvl-0/lvl-1) days", () => {
    const { streak } = buildHeatmap(2023, now, days, exceptionals);
    expect(streak).toBe(2);
  });

  it("lists realized exceptional labels, biggest first, and reports realized days", () => {
    const { exceptionalLabels, realizedDays } = buildHeatmap(2023, now, days, exceptionals);
    expect(exceptionalLabels).toEqual(["ordinateur", "vélo"]);
    expect(realizedDays).toBe(10);
  });

  it("places days on the calendar grid (Jan 1 2023 = Sunday) and pads/futures the rest", () => {
    const { rows } = buildHeatmap(2023, now, days, exceptionals);
    expect(rows[6][0]).toBe("lvl-0"); // Sun 01-01
    expect(rows[0][1]).toBe("lvl-4"); // Mon 01-02 (heaviest day)
    expect(rows[0][0]).toBe("empty"); // Mon of week 0 = 2022-12-26, out of year
    expect(rows[2][2]).toBe("future"); // Wed 01-11, past the realized window
  });

  it("handles a year with no spending: no scale, no busiest day, every day sober", () => {
    const { scaleMax, busiest, counts, streak, realizedDays } = buildHeatmap(2023, new Date(2023, 5, 1), [], []);
    expect(scaleMax).toBe(0);
    expect(busiest).toBeNull();
    expect(counts["lvl-0"]).toBe(realizedDays);
    expect(counts["lvl-neg"]).toBe(0);
    expect(streak).toBe(realizedDays);
  });
});
