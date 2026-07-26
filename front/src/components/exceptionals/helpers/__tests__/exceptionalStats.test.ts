import { computeExceptionalStats } from "@components/exceptionals/helpers/exceptionalStats";
import { elapsedMonths } from "@components/statistics/helpers/statisticsData";
import { describe, expect, it } from "vitest";

import type { ExceptionalItem } from "@src/schemas/exceptionals";

// 11 July 2026 → month index 6 → 7 elapsed months in the current year.
const NOW = new Date(2026, 6, 11);

const item = (date: string, amount: number, label = "Achat"): ExceptionalItem => ({
  ID: "1",
  userID: "user-1",
  date,
  itemType: "exceptional",
  label,
  amount,
  description: null,
  currency: null,
  categoryName: null,
  categoryColor: null,
  invoicefile: null,
});

describe("computeExceptionalStats — monthly average (COS-51)", () => {
  it("current year divides by elapsed months, not a fixed 12", () => {
    // Ticket example: 700 € on 10 July → ~100 €/month (700/7), not 58 € (700/12).
    const stats = computeExceptionalStats([item("2026-03-10", 700)], 2026, NOW);
    expect(stats.spanMonths).toBe(7);
    expect(stats.average).toBe(100);
  });

  it("past complete year still divides by 12", () => {
    const stats = computeExceptionalStats([item("2024-05-01", 700)], 2024, NOW);
    expect(stats.spanMonths).toBe(12);
    expect(stats.average).toBeCloseTo(58.33, 2);
  });

  it("current year in January divides by 1", () => {
    const jan = new Date(2026, 0, 15);
    const stats = computeExceptionalStats([item("2026-01-05", 300)], 2026, jan);
    expect(stats.spanMonths).toBe(1);
    expect(stats.average).toBe(300);
  });

  it("current year in December divides by the full 12", () => {
    const dec = new Date(2026, 11, 20);
    const stats = computeExceptionalStats([item("2026-02-01", 1200)], 2026, dec);
    expect(stats.spanMonths).toBe(12);
    expect(stats.average).toBe(100);
  });
});

describe("computeExceptionalStats — all years (year == null)", () => {
  it("sums the elapsed months of every covered year (current year not a full 12)", () => {
    const stats = computeExceptionalStats(
      [item("2024-06-01", 100), item("2025-06-01", 100), item("2026-06-01", 100)],
      null,
      NOW,
    );
    // 12 (2024) + 12 (2025) + 7 (2026) = 31.
    expect(stats.spanMonths).toBe(31);
    expect(stats.average).toBeCloseTo(300 / 31, 6);
  });

  it("only counts years present in the data (gap years excluded)", () => {
    const stats = computeExceptionalStats([item("2022-04-01", 500), item("2026-04-01", 500)], null, NOW);
    // 12 (2022) + 7 (2026) = 19; the empty 2023–2025 do not count.
    expect(stats.spanMonths).toBe(19);
  });
});

describe("computeExceptionalStats — edge cases", () => {
  it("empty data over all years floors the divisor at 1 (no NaN)", () => {
    const stats = computeExceptionalStats([], null, NOW);
    expect(stats.spanMonths).toBe(1);
    expect(stats.total).toBe(0);
    expect(stats.average).toBe(0);
    expect(stats.count).toBe(0);
    expect(stats.biggest).toBeNull();
  });

  it("empty data for a single year divides by elapsed months (no NaN)", () => {
    const stats = computeExceptionalStats([], 2026, NOW);
    expect(stats.spanMonths).toBe(7);
    expect(stats.average).toBe(0);
  });
});

describe("computeExceptionalStats — aggregates", () => {
  it("computes total, count and the biggest expense", () => {
    const stats = computeExceptionalStats(
      [item("2026-01-01", 100, "A"), item("2026-02-01", 500, "B"), item("2026-03-01", 300, "C")],
      2026,
      NOW,
    );
    expect(stats.total).toBe(900);
    expect(stats.count).toBe(3);
    expect(stats.biggest?.amount).toBe(500);
    expect(stats.biggest?.label).toBe("B");
  });

  it("keeps the first item on a biggest-amount tie", () => {
    const stats = computeExceptionalStats(
      [item("2026-01-01", 500, "First"), item("2026-02-01", 500, "Second")],
      2026,
      NOW,
    );
    expect(stats.biggest?.label).toBe("First");
  });
});

describe("computeExceptionalStats — consistency with Statistiques", () => {
  it("uses the same per-month divisor as elapsedMonths for a single year", () => {
    for (const year of [2024, 2025, 2026]) {
      const stats = computeExceptionalStats([item(`${year}-05-01`, 240)], year, NOW);
      expect(stats.spanMonths).toBe(elapsedMonths(year, NOW));
    }
  });
});
