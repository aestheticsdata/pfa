import { UploadBudget } from "@core/limits/uploadBudget";
import { Rng } from "@core/random/rng";
import { describe, expect, it } from "vitest";

const DAY_MS = 24 * 60 * 60 * 1000;
const MB = 1024 * 1024;

describe("UploadBudget", () => {
  it("never crosses 400 MB over any rolling 365 days — a simulated year of 500 bots, then some", () => {
    let now = 0;
    const budget = new UploadBudget({ budgetBytes: 400 * MB, windowMs: 365 * DAY_MS, entries: [] }, () => now);
    const rng = new Rng(1);
    // Deliberately greedy: 500 bots trying ~4 uploads a week each (twice the planned pace), biggest pictures.
    const tries = 500 * 4;
    let accepted = 0;
    for (let day = 0; day < 2 * 365; day++) {
      for (let i = 0; i < tries / 7; i++) {
        now = day * DAY_MS + rng.int(0, DAY_MS - 1);
        if (budget.reserve(7 * 1024)) {
          accepted += 1;
        }
        expect(budget.usedBytes()).toBeLessThanOrEqual(400 * MB);
      }
    }
    expect(accepted).toBeGreaterThan(0);
  });

  it("refuses what doesn't fit, records nothing, and frees space as uploads age out", () => {
    let now = 0;
    const budget = new UploadBudget({ budgetBytes: 10, windowMs: 100, entries: [] }, () => now);
    expect(budget.reserve(8)).toBe(true);
    expect(budget.reserve(5)).toBe(false);
    expect(budget.usedBytes()).toBe(8);
    now = 101;
    expect(budget.reserve(5)).toBe(true);
  });

  it("refuses empty or negative sizes", () => {
    const budget = new UploadBudget({ budgetBytes: 10, windowMs: 100, entries: [] });
    expect(budget.reserve(0)).toBe(false);
    expect(budget.reserve(-1)).toBe(false);
  });
});
