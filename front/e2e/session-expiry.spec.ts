import { API, getCsrfToken } from "@e2e/helpers/api";
import { expect, test } from "@playwright/test";

// Text of the global error boundary (src/app/error.tsx).
const ERROR_BOUNDARY = "Something went wrong";

// An expired session must land on /login, never on the error page (COS-26): the
// request layer turns the API's 401 into a redirect and leaves the query pending.
// Runs in its own project, after every other test (see playwright.config.ts): it
// destroys the session they all share.
test("an expired session sends the user to the login page", async ({ page }) => {
  await page.goto("/dashboard");
  await expect(page.getByRole("heading", { name: "Plafond hebdomadaire" })).toBeVisible();
  await page.waitForLoadState("networkidle");

  // The session dies server-side, as a Redis expiry would. Clearing the browser cookie
  // is not enough: the session is rolling, so any response still in flight sets it again.
  const logout = await page.request.post(`${API}/users/logout`, {
    headers: { "x-csrf-token": await getCsrfToken(page) },
  });
  expect(logout.ok()).toBeTruthy();

  // A client-side navigation: the layout stays, the next page's queries hit the API with no session.
  await page.getByRole("link", { name: "Statistiques" }).click();

  // Generous: under `next dev` the first visit compiles the route on demand.
  await expect(page).toHaveURL(/\/login\/?$/, { timeout: 20_000 });
  await expect(page.getByLabel("Email")).toBeVisible();
  await expect(page.getByText(ERROR_BOUNDARY)).toBeHidden();
});
