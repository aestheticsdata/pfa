import { createSentinelSpending, sweepSentinelSpendings } from "@e2e/helpers/sentinel";
import { expect, test } from "@playwright/test";

import type { Response } from "@playwright/test";

test.afterEach(async ({ page }) => {
  await sweepSentinelSpendings(page);
});

const monthlyStats = (response: Response) =>
  response.url().includes("/api/monthlystats") && response.request().method() === "GET";

// Editing a spending must refresh every cache that sums it (PFA-253): the list
// and, across modules, the dashboard's monthly totals — without a reload. The
// spending is dated today, so in any week of the month: the list used to be
// invalidated with the week's bounds while cached under the month's.
test("editing an amount updates the list and the dashboard totals", async ({ page }) => {
  const label = await createSentinelSpending(page, 10);

  // Dashboard first, so its monthly stats are cached before the edit.
  const before = page.waitForResponse(monthlyStats);
  await page.goto("/dashboard");
  const { spendingsSum: sumBefore } = await (await before).json();

  await page.getByRole("link", { name: "Dépenses" }).click();
  const row = page.getByTestId("tx-row").filter({ hasText: label });
  await expect(row).toBeVisible();
  await row.hover();
  await row.getByTestId("tx-edit").click();

  const modal = page.getByTestId("spending-modal");
  await modal.getByLabel("Montant").fill("110");
  // The invalidated monthly stats refetch wherever they are next read — here if a
  // mounted widget reads them, else on the dashboard — so listen from the save on.
  const after = page.waitForResponse(monthlyStats);
  await modal.getByTestId("spending-submit").click();

  await expect(page.getByText("dépense mise à jour")).toBeVisible();
  await expect(row).toContainText("110");

  // Back on the dashboard without a reload.
  await page.getByRole("link", { name: "Dashboard" }).click();
  await expect(page.getByRole("heading", { name: "Plafond hebdomadaire" })).toBeVisible();
  const { spendingsSum: sumAfter } = await (await after).json();
  expect(sumAfter).toBeCloseTo(sumBefore + 100, 2);
});
