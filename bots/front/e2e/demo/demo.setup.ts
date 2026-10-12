import { expect, test as setup } from "@playwright/test";

/**
 * Signing in for the take, off camera: the film opens on the app picker, never on a password.
 *
 * On a fresh database the back-office has no account yet and every visit goes to `/setup`, so the
 * setup creates it there first, from `.env.test.local` — a mock account on a local API, never a real
 * one. Everything else the take films — the runner's fleet, its day, the two open incidents — is
 * the mock's (`BOTS_MODE=mock`), re-created when the API boots: restart it before every take.
 */
const STORAGE_STATE = "e2e/.auth/demo.json";

/** Every page the take opens, the drawer's and the modal's routes among them. */
const WARM = ["overview", "bots", "bots/legionary-007", "metrics", "actions", "incidents", "close/legionary-042"];

setup("sign in for the demo", async ({ page }) => {
  const email = process.env.DEMO_EMAIL as string;
  const password = process.env.DEMO_PASSWORD as string;
  const passphrase = process.env.DEMO_PASSPHRASE as string;

  await page.goto("/signin");
  if (new URL(page.url()).pathname === "/setup") {
    await page.fill('input[name="email"]', email);
    await page.fill('input[name="password"]', password);
    await page.fill('input[name="confirm"]', password);
    await page.fill('input[name="recoveryPassphrase"]', passphrase);
    await page.click('button[type="submit"]');
  } else {
    await page.fill('input[name="email"]', email);
    await page.fill('input[name="password"]', password);
    await page.click('button[type="submit"]');
  }

  // The picker lists the mock's two apps: the signed-in page has rendered.
  await expect(page.getByTestId("app-card-pfa")).toBeVisible({ timeout: 15_000 });
  await page.context().storageState({ path: STORAGE_STATE });

  // Filmed on `pnpm dev` — a production build sets its session cookie `secure`, which plain http on
  // a laptop never sends back — so every route the take visits is compiled here first, off camera.
  for (const view of WARM) {
    await page.goto(`/pfa/${view}`);
    await expect(page.getByTestId("nav-overview")).toBeVisible({ timeout: 60_000 });
  }
  // The drawer and the close-account modal are intercepted routes: only a click inside the app
  // compiles them, so each is opened once by hand.
  await page.goto("/pfa/bots");
  await page.locator('[data-testid^="bot-row-legionary-"]').first().click();
  await expect(page.getByTestId("bot-drawer")).toBeVisible({ timeout: 60_000 });
  await page.goto("/pfa/incidents");
  await page.getByTestId("incident-row").first().getByRole("link", { name: "Disable / purge" }).click();
  await expect(page.getByTestId("close-account-modal")).toBeVisible({ timeout: 60_000 });
});
