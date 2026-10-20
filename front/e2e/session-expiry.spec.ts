import { expect, test } from "@playwright/test";

// Text of the global error boundary (src/app/error.tsx).
const ERROR_BOUNDARY = "Something went wrong";

// An expired session must land on /login, never on the error page (COS-26): the
// request layer turns the API's 401 into a redirect and leaves the query pending.
test("an expired session sends the user to the login page", async ({ page }) => {
  await page.goto("/dashboard");
  await expect(page.getByRole("heading", { name: "Plafond hebdomadaire" })).toBeVisible();

  // The session dies under the open page — the browser loses its cookie.
  await page.context().clearCookies();

  // A client-side navigation: the layout stays, the next page's queries hit the API with no session.
  await page.getByRole("link", { name: "Statistiques" }).click();

  await expect(page).toHaveURL(/\/login\/?$/);
  await expect(page.getByLabel("Email")).toBeVisible();
  await expect(page.getByText(ERROR_BOUNDARY)).toBeHidden();
});
