import { PFA_DAILY_BOTS, PFA_LOAD_BOTS, PFA_SYNTHETIC_DOMAIN } from "@apps/pfa/persona/bots";
import { CATEGORIES } from "@apps/pfa/persona/categories";
import { clampAmount, plausibleDate, SPENDING_BOUNDS } from "@apps/pfa/persona/guardrails";
import { BOT_KIND } from "@core/constants/bot";
import { isSyntheticEmail } from "@core/guards/syntheticEmail";
import { Rng } from "@core/random/rng";
import { describe, expect, it } from "vitest";

describe("PFA guardrails", () => {
  it("bounds every amount, whatever the catalog says", () => {
    expect(clampAmount(-5)).toBe(SPENDING_BOUNDS.minAmount);
    expect(clampAmount(1e6)).toBe(SPENDING_BOUNDS.maxAmount);
    expect(clampAmount(12.345)).toBe(12.35);
  });

  it("dates a spending today or at most two days back, on the bot's own clock", () => {
    const rng = new Rng(3);
    // 23:30 UTC on Oct 10 is already Oct 11 in Paris (UTC+2): "today" is the 11th.
    const today = new Date(Date.UTC(2026, 9, 10, 23, 30));
    const allowed = ["2026-10-11", "2026-10-10", "2026-10-09"];
    for (let i = 0; i < 500; i++) {
      expect(allowed).toContain(plausibleDate(today, rng, "Europe/Paris"));
    }
  });

  it("has four daily bots on the synthetic domain, buying only from the category pool", () => {
    const pool = Object.values(CATEGORIES).map((category) => category.name);
    expect(PFA_DAILY_BOTS.map((bot) => bot.id)).toEqual(["saturnus", "ceres", "janus", "minerva"]);
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

  it("has 500 load bots, legionary-001 to legionary-500, on the synthetic domain and the same pool", () => {
    const pool = Object.values(CATEGORIES).map((category) => category.name);
    expect(PFA_LOAD_BOTS).toHaveLength(500);
    expect(PFA_LOAD_BOTS[0]?.id).toBe("legionary-001");
    expect(PFA_LOAD_BOTS[499]?.id).toBe("legionary-500");
    expect(new Set(PFA_LOAD_BOTS.map((bot) => bot.email)).size).toBe(500);
    for (const bot of PFA_LOAD_BOTS) {
      expect(bot.kind).toBe(BOT_KIND.load);
      expect(isSyntheticEmail(bot.email, PFA_SYNTHETIC_DOMAIN)).toBe(true);
      for (const item of bot.persona.catalog) expect(pool).toContain(item.category.name);
    }
  });
});
