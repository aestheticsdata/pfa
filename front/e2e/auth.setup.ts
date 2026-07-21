import { expect, test as setup } from "@playwright/test";

const AUTH_FILE = "e2e/.auth/user.json";

// Logs in once through the real login form and persists the pfa.sid session cookie.
// Doubles as the login E2E test.
setup("login and persist session", async ({ page }) => {
  const email = process.env.E2E_EMAIL ?? "abc@abc.com";
  const password = process.env.E2E_PASSWORD;
  if (!password) {
    throw new Error("E2E_PASSWORD manquant — copier .env.test.local.example vers .env.test.local et le remplir.");
  }

  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Mot de passe", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Se connecter" }).click();

  await page.waitForURL(/\/dashboard/);
  await expect(page.getByRole("heading", { name: "Plafond hebdomadaire" })).toBeVisible();

  await page.context().storageState({ path: AUTH_FILE });
});
