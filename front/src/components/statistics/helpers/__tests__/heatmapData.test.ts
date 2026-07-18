import { bandFor, buildHeatmap, LEVEL } from "@components/statistics/helpers/heatmapData";

import type { ExceptionalItem } from "@src/schemas/exceptionals";
import type { DailyStat } from "@src/schemas/stats";

const day = (date: string, total: number, count = 1): DailyStat => ({ date, total, count });
const exc = (date: string, amount: number, label: string): ExceptionalItem =>
  ({ ID: date, userID: "u1", date, itemType: "exceptional", label, amount }) as ExceptionalItem;

describe("bandFor", () => {
  it("is lvl-0 at or below zero, or when there is no scale", () => {
    expect(bandFor(0, 100)).toBe(LEVEL.ZERO);
    expect(bandFor(-5, 100)).toBe(LEVEL.ZERO);
    expect(bandFor(50, 0)).toBe(LEVEL.ZERO);
  });

  it("spreads positive amounts over four bands up to the max", () => {
    expect(bandFor(1, 100)).toBe(LEVEL.ONE);
    expect(bandFor(25, 100)).toBe(LEVEL.ONE);
    expect(bandFor(26, 100)).toBe(LEVEL.TWO);
    expect(bandFor(50, 100)).toBe(LEVEL.TWO);
    expect(bandFor(75, 100)).toBe(LEVEL.THREE);
    expect(bandFor(100, 100)).toBe(LEVEL.FOUR);
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
    expect(counts).toEqual({
      [LEVEL.ZERO]: 6,
      [LEVEL.ONE]: 1,
      [LEVEL.TWO]: 0,
      [LEVEL.THREE]: 0,
      [LEVEL.FOUR]: 1,
      [LEVEL.NEG]: 2,
    });
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
    expect(rows[6][0]).toBe(LEVEL.ZERO); // Sun 01-01
    expect(rows[0][1]).toBe(LEVEL.FOUR); // Mon 01-02 (heaviest day)
    expect(rows[0][0]).toBe(LEVEL.EMPTY); // Mon of week 0 = 2022-12-26, out of year
    expect(rows[2][2]).toBe(LEVEL.FUTURE); // Wed 01-11, past the realized window
  });

  it("carries per-cell tooltip metadata; future and out-of-year slots stay null", () => {
    const { cells } = buildHeatmap(2023, now, days, exceptionals);
    expect(cells[0][1]).toEqual({ date: "2023-01-02", amount: 100, level: LEVEL.FOUR, exceptionals: [] });
    expect(cells[3][1]).toEqual({
      date: "2023-01-05",
      amount: 0,
      level: LEVEL.NEG,
      exceptionals: [{ label: "ordinateur", amount: 800 }],
    });
    expect(cells[2][2]).toBeNull(); // 01-11, future
    expect(cells[0][0]).toBeNull(); // out-of-year padding
  });

  it("handles a year with no spending: no scale, no busiest day, every day sober", () => {
    const { scaleMax, busiest, counts, streak, realizedDays } = buildHeatmap(2023, new Date(2023, 5, 1), [], []);
    expect(scaleMax).toBe(0);
    expect(busiest).toBeNull();
    expect(counts[LEVEL.ZERO]).toBe(realizedDays);
    expect(counts[LEVEL.NEG]).toBe(0);
    expect(streak).toBe(realizedDays);
  });
});
