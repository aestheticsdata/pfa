import { PFA_DAILY_BOTS, PFA_SYNTHETIC_DOMAIN } from "@apps/pfa/persona/bots";
import { CATEGORIES } from "@apps/pfa/persona/categories";
import { clampAmount, isoDay, plausibleDate, SPENDING_BOUNDS } from "@apps/pfa/persona/guardrails";
import { isSyntheticEmail } from "@core/guards/syntheticEmail";
import { Rng } from "@core/random/rng";
import { describe, expect, it } from "vitest";

describe("PFA guardrails", () => {
  it("bounds every amount, whatever the catalog says", () => {
    expect(clampAmount(-5)).toBe(SPENDING_BOUNDS.minAmount);
    expect(clampAmount(1e6)).toBe(SPENDING_BOUNDS.maxAmount);
    expect(clampAmount(12.345)).toBe(12.35);
  });

  it("dates a spending today or at most two days back", () => {
    const rng = new Rng(3);
    const today = new Date(2026, 9, 10, 15);
    const allowed = [0, 1, 2].map((back) => isoDay(new Date(2026, 9, 10 - back)));
    for (let i = 0; i < 500; i++) {
      expect(allowed).toContain(plausibleDate(today, rng));
    }
  });

  it("has four daily bots on the synthetic domain, buying only from the category pool", () => {
    const pool = Object.values(CATEGORIES).map((category) => category.name);
    expect(PFA_DAILY_BOTS.map((bot) => bot.id)).toEqual(["saturnus", "ceres", "janus", "bacchus"]);
    for (const bot of PFA_DAILY_BOTS) {
      expect(isSyntheticEmail(bot.email, PFA_SYNTHETIC_DOMAIN)).toBe(true);
      for (const item of bot.persona.catalog) {
        expect(pool).toContain(item.category.name);
        expect(item.category.name.length).toBeLessThanOrEqual(20);
        expect(item.min).toBeGreaterThanOrEqual(SPENDING_BOUNDS.minAmount);
        expect(item.max).toBeLessThanOrEqual(SPENDING_BOUNDS.maxAmount);
      }
      expect(bot.persona.receiptsPerWeek).toBeGreaterThan(0);
      expect(bot.persona.receiptsPerWeek).toBeLessThanOrEqual(3.5);
    }
  });
});

describe("monthly bills", () => {
  it("are entered once a month, no more", async () => {
    const { billPaid, rememberBill } = await import("@apps/pfa/persona/botMemory");
    const memory = new Map<string, unknown>();
    const electricity = PFA_DAILY_BOTS[0]?.persona.catalog.find((item) => item.monthly);
    if (!electricity) throw new Error("saturnus has no bill");
    expect(billPaid(memory, electricity, "2026-10-03")).toBe(false);
    rememberBill(memory, electricity, "2026-10-03");
    expect(billPaid(memory, electricity, "2026-10-28")).toBe(true);
    expect(billPaid(memory, electricity, "2026-11-01")).toBe(false);
  });
});
