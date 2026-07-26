import { API, getCsrfToken } from "@e2e/helpers/api";
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

  // The suite asserts French copy, but LocaleUserSync applies the language
  // persisted on the account (COS-155), which wins over the browser locale.
  // Pin it to French so switching the app to English by hand doesn't turn
  // every locator into a miss.
  await page.request.patch(`${API}/users/me`, {
    headers: { "x-csrf-token": await getCsrfToken(page) },
    data: { language: "fr" },
  });
  await page.reload();

  await expect(page.getByRole("heading", { name: "Plafond hebdomadaire" })).toBeVisible();

  await page.context().storageState({ path: AUTH_FILE });
});
