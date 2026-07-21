import { expect, test } from "@playwright/test";

test.describe("public pages", () => {
  test("login renders its form", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByRole("heading", { name: "Personal Finance Assistant" })).toBeVisible();
    await expect(page.getByLabel("Email")).toBeVisible();
    await expect(page.getByLabel("Mot de passe", { exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "Se connecter" })).toBeVisible();
  });

  test("signup renders its form", async ({ page }) => {
    await page.goto("/signup");
    await expect(page.getByLabel("Email")).toBeVisible();
    await expect(page.getByLabel("Mot de passe", { exact: true })).toBeVisible();
    await expect(page.getByLabel("Confirmer le mot de passe")).toBeVisible();
    await expect(page.getByRole("button", { name: "Créer un compte" })).toBeVisible();
  });
});
