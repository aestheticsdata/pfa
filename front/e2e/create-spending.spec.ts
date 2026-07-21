import { expect, test } from "@playwright/test";

const API = "http://localhost:6100/api";
// Sentinel prefix identifying spendings created by this suite (cleaned up in afterEach).
const SENTINEL_PREFIX = "E2E ";

function isoDay(d: Date): string {
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${month}-${day}`;
}

// Residue guard: even if the test fails midway, no sentinel spending survives
// in the demo account. page.request shares the browser session cookie.
test.afterEach(async ({ page }) => {
  const csrfResponse = await page.request.get(`${API}/users/csrf`);
  if (!csrfResponse.ok()) {
    throw new Error(`Nettoyage E2E impossible : /users/csrf a répondu ${csrfResponse.status()}`);
  }
  const { csrfToken } = await csrfResponse.json();

  const now = new Date();
  const from = isoDay(new Date(now.getFullYear(), now.getMonth(), 1));
  const to = isoDay(new Date(now.getFullYear(), now.getMonth() + 1, 0));
  const spendings: Array<{ ID: string; label: string }> = await (
    await page.request.get(`${API}/spendings?from=${from}&to=${to}`)
  ).json();

  for (const spending of spendings) {
    if (spending.label?.startsWith(SENTINEL_PREFIX)) {
      await page.request.delete(`${API}/spendings/${spending.ID}`, {
        headers: { "x-csrf-token": csrfToken },
      });
    }
  }
});

test("create then delete a spending through the modal", async ({ page }) => {
  const label = `${SENTINEL_PREFIX}${Date.now()}`;
  await page.goto("/spendings");
  await expect(page.locator("[data-sp-day]")).toHaveCount(7);

  // Create via the floating button (defaults to today's date)
  await page.getByRole("button", { name: "Nouvelle dépense" }).click();
  const modal = page.getByRole("dialog", { name: "Nouvelle dépense" });
  await expect(modal).toBeVisible();
  await modal.getByLabel("Label").fill(label);
  await modal.getByLabel("Montant").fill("12.34");
  // Pick the first existing category from the combobox
  await modal.getByRole("combobox").click();
  await page.getByRole("option").first().click();
  await modal.getByRole("button", { name: "Ajouter la dépense" }).click();

  // Toast + row in today's card = mutation + invalidateQueries refetch both worked
  await expect(page.getByText("dépense créée")).toBeVisible();
  const todayCard = page.locator(`[data-sp-day="${isoDay(new Date())}"]`);
  const rowLabel = todayCard.locator(`span[title="${label}"]`);
  await expect(rowLabel).toBeVisible();

  // Delete it: hover reveals the row actions (display:none otherwise, so the
  // only "Supprimer" button in the accessibility tree belongs to this row)
  await rowLabel.hover();
  await todayCard.getByRole("button", { name: "Supprimer" }).click();
  const confirmDialog = page.getByRole("alertdialog", { name: "Confirmer la suppression" });
  await expect(confirmDialog.getByText("Supprimer cette dépense ?")).toBeVisible();
  await confirmDialog.getByRole("button", { name: "Confirmer" }).click();

  await expect(page.getByText("dépense supprimée")).toBeVisible();
  await expect(rowLabel).toHaveCount(0);
});
