import { createSentinelSpending, sweepSentinelSpendings } from "@e2e/helpers/sentinel";
import { expect, test } from "@playwright/test";

// A 1×1 transparent PNG: a real image the API accepts, small enough to inline.
const PNG_1PX = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==",
  "base64",
);

test.afterEach(async ({ page }) => {
  await sweepSentinelSpendings(page);
});

// The receipt flow end to end (PFA-243, PFA-250): stage a file, send it with the
// upload progress, see the image, delete it.
test("attach a receipt to a spending, see it, delete it", async ({ page }) => {
  const label = await createSentinelSpending(page, 4.2);

  await page.goto("/spendings");
  const row = page.getByTestId("tx-row").filter({ hasText: label });
  await expect(row).toBeVisible();
  await row.hover();
  await row.getByTestId("tx-receipt").click();

  const modal = page.getByTestId("receipt-modal");
  await expect(modal.getByText("Aucune facture")).toBeVisible();

  await modal.getByTestId("receipt-pick").locator('input[type="file"]').setInputFiles({
    name: "ticket.png",
    mimeType: "image/png",
    buffer: PNG_1PX,
  });
  await modal.getByTestId("receipt-send").click();
  await expect(modal.getByTestId("receipt-image")).toBeVisible();

  await modal.getByRole("button", { name: "Supprimer la facture" }).click();
  const confirm = page.getByRole("alertdialog", { name: "Supprimer la facture ?" });
  await confirm.getByRole("button", { name: "Supprimer", exact: true }).click();

  await expect(modal.getByText("Aucune facture")).toBeVisible();
  await expect(modal.getByTestId("receipt-image")).toHaveCount(0);
});
