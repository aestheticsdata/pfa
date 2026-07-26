import { daysInWeekOf } from "@e2e/helpers/week";
import { expect, test } from "@playwright/test";

// Text of the global error boundary (src/app/error.tsx) — a broken query throws into it.
const ERROR_BOUNDARY = "Something went wrong";

test.describe("private pages smoke", () => {
  test("dashboard renders with data", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page.getByRole("heading", { name: "Plafond hebdomadaire" })).toBeVisible();
    await expect(page.getByText(/— budget restant/)).toBeVisible();
    // NavBar only renders once the user context resolved
    await expect(page.getByRole("link", { name: "Statistiques" })).toBeVisible();
    await expect(page.getByText(ERROR_BOUNDARY)).toBeHidden();
  });

  test("spendings renders the week with data", async ({ page }) => {
    await page.goto("/spendings");
    // The day cards only render once the spendings query resolved
    await expect(page.locator("[data-sp-day]")).toHaveCount(daysInWeekOf(new Date()));
    await expect(page.getByRole("button", { name: "Nouvelle dépense" })).toBeVisible();
    await expect(page.getByText(ERROR_BOUNDARY)).toBeHidden();
  });

  test("statistics loads its data", async ({ page }) => {
    // /statistics swallows query errors (renders zeros instead of throwing) —
    // assert the API call itself succeeds, not just the static headings.
    const statsResponse = page.waitForResponse(
      (r) => r.url().includes("/api/statistics") && r.request().method() === "GET",
    );
    await page.goto("/statistics");
    expect((await statsResponse).ok()).toBeTruthy();
    await expect(page.getByRole("heading", { name: "Dépenses mensuelles", exact: true })).toBeVisible();
    await expect(page.getByText(/Total dépensé/)).toBeVisible();
    await expect(page.getByText(ERROR_BOUNDARY)).toBeHidden();
  });

  test("categories renders the list", async ({ page }) => {
    await page.goto("/categories");
    await expect(page.getByRole("heading", { name: "Catégories" })).toBeVisible();
    // The loading spinner must resolve into the list
    await expect(page.locator('img[alt="spinner"]')).toHaveCount(0);
    await expect(page.getByPlaceholder("Rechercher une catégorie…")).toBeVisible();
    await expect(page.getByText(ERROR_BOUNDARY)).toBeHidden();
  });

  test("exceptionals renders stats and list", async ({ page }) => {
    await page.goto("/exceptionals");
    await expect(page.getByText("Part des dépenses")).toBeVisible();
    await expect(page.getByRole("button", { name: "Ajouter", exact: true })).toBeVisible();
    await expect(page.locator('img[alt="spinner"]')).toHaveCount(0);
    await expect(page.getByText(ERROR_BOUNDARY)).toBeHidden();
  });
});
