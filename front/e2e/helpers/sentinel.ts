import { API, getCsrfToken } from "@e2e/helpers/api";

import type { Page } from "@playwright/test";

/** Prefix identifying the spendings the suite creates — swept after every test that uses it. */
export const SENTINEL_PREFIX = "E2E ";

export const isoDay = (d: Date): string => {
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${month}-${day}`;
};

const currentMonth = () => {
  const now = new Date();
  return {
    from: isoDay(new Date(now.getFullYear(), now.getMonth(), 1)),
    to: isoDay(new Date(now.getFullYear(), now.getMonth() + 1, 0)),
  };
};

/** Creates a sentinel spending dated today through the API (PFA-251), and returns its label. */
export const createSentinelSpending = async (page: Page, amount: number): Promise<string> => {
  const label = `${SENTINEL_PREFIX}${Date.now()}`;
  const response = await page.request.post(`${API}/spendings`, {
    headers: { "x-csrf-token": await getCsrfToken(page) },
    data: { date: isoDay(new Date()), label, amount, currency: "EUR" },
  });
  if (!response.ok()) throw new Error(`POST /spendings a répondu ${response.status()}`);
  return label;
};

/** Residue guard: removes every sentinel spending of the month, even after a failed test. */
export const sweepSentinelSpendings = async (page: Page): Promise<void> => {
  const csrfToken = await getCsrfToken(page);
  const { from, to } = currentMonth();
  const spendings: Array<{ ID: string; label: string }> = await (
    await page.request.get(`${API}/spendings?from=${from}&to=${to}`)
  ).json();

  for (const spending of spendings) {
    if (spending.label?.startsWith(SENTINEL_PREFIX)) {
      await page.request.delete(`${API}/spendings/${spending.ID}`, { headers: { "x-csrf-token": csrfToken } });
    }
  }
};
