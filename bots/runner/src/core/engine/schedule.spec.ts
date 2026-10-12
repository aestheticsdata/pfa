import { nextWakeAt } from "@core/engine/schedule";
import { Rng } from "@core/random/rng";
import { zonedHour } from "@core/time/zonedTime";
import { describe, expect, it } from "vitest";

describe("nextWakeAt", () => {
  it("always lands later, during waking hours (07:00–23:00) on the app's clock, across DST", () => {
    const rng = new Rng(42);
    let from = new Date(Date.UTC(2026, 9, 10, 12, 0, 0));
    for (let i = 0; i < 2000; i++) {
      const next = nextWakeAt(from, rng, "Europe/Paris");
      expect(next.getTime()).toBeGreaterThan(from.getTime());
      const hour = zonedHour(next, "Europe/Paris");
      expect(hour).toBeGreaterThanOrEqual(7);
      expect(hour).toBeLessThan(23);
      from = next;
    }
  });

  it("gives about 2–3 visits a day on average", () => {
    const rng = new Rng(7);
    const start = new Date(2026, 0, 1, 7, 0, 0);
    let at = start;
    let visits = 0;
    while (at.getTime() < start.getTime() + 365 * 24 * 3600 * 1000) {
      at = nextWakeAt(at, rng, "Europe/Paris");
      visits += 1;
    }
    expect(visits / 365).toBeGreaterThan(1.8);
    expect(visits / 365).toBeLessThan(3.2);
  });

  it("leaves 1–2 visits a day outside the quiet hours, at an hour that changes from day to day", () => {
    const rng = new Rng(11);
    const start = new Date(Date.UTC(2026, 0, 1, 6, 0, 0));
    const firstHourOfDay = new Map<string, number>();
    let at = start;
    let outsideQuiet = 0;
    while (at.getTime() < start.getTime() + 365 * 24 * 3600 * 1000) {
      at = nextWakeAt(at, rng, "Europe/Paris");
      const hour = zonedHour(at, "Europe/Paris");
      // Spendings are only entered from 10:00 to 22:00 (default quiet hours), at most one a visit.
      if (hour >= 10 && hour < 22) outsideQuiet += 1;
      const day = at.toISOString().slice(0, 10);
      if (!firstHourOfDay.has(day)) firstHourOfDay.set(day, hour);
    }
    expect(outsideQuiet / 365).toBeGreaterThan(1);
    expect(outsideQuiet / 365).toBeLessThan(2.5);
    expect(new Set(firstHourOfDay.values()).size).toBeGreaterThanOrEqual(8);
  });

  it("wakes a crowd of bots at random through the day: no pile-up at 07:00 (PFA-228)", () => {
    const rng = new Rng(3);
    const start = new Date(Date.UTC(2026, 9, 12, 10, 0, 0));
    const end = start.getTime() + 7 * 24 * 3600 * 1000;
    const quarters = new Map<number, number>();
    for (let bot = 0; bot < 500; bot++) {
      let at = nextWakeAt(start, rng, "Europe/Paris");
      while (at.getTime() < end) {
        const quarter = Math.floor(at.getTime() / (15 * 60 * 1000));
        quarters.set(quarter, (quarters.get(quarter) ?? 0) + 1);
        at = nextWakeAt(at, rng, "Europe/Paris");
      }
    }
    const counts = [...quarters.values()];
    // 16 waking hours a day, 4 quarters each.
    const mean = counts.reduce((sum, count) => sum + count, 0) / (7 * 16 * 4);
    expect(Math.max(...counts)).toBeLessThan(2 * mean);
  });
});
