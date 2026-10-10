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
});
