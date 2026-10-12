import { expect, test } from "./fixture";

import type { Page } from "@playwright/test";

/**
 * The back-office, in about two minutes — one continuous take, six chapters, for the landing page's
 * film.
 *
 * This file is the storyboard and nothing else: the pointer, the video and the timing live in
 * `cursor.ts`, `fixture.ts` and `pacing.ts`, so what is left reads as a shot list.
 *
 * Everything on screen is the mock's (`BOTS_MODE=mock`): PFA on a simulated runner, seed 1991, and
 * the two open incidents the API seeds when it boots. The take changes that state — a target, a
 * pace, eleven bots turned off, an action, an account purged — and puts back what the stills need;
 * the rest goes when the API restarts, which every take starts from.
 */

const DAY_CHART = "Actions / 15 min — last 24 hours";

/** The load target the take raises to, from the mock's 120. */
const TARGET = "250";

/** The search the take types: legionary-010 to legionary-019. */
const QUERY = "legionary-01";

/** The incident the take closes: a load bot's account used from a foreign IP. */
const COMPROMISED = "legionary-042";

/** The busiest slice of the day chart: the one worth opening. */
async function busiestSlice(page: Page) {
  const bars = page.getByRole("figure", { name: DAY_CHART }).getByRole("button");
  const labels = await bars.evaluateAll((nodes) => nodes.map((node) => node.getAttribute("aria-label") ?? ""));
  const actions = labels.map((label) => Number(/: (\d[\d,]*) actions/.exec(label)?.[1]?.replace(/,/g, "") ?? 0));
  return bars.nth(actions.indexOf(Math.max(...actions)));
}

/** The degraded bot the take opens, for the drawer's still. */
let flakyId = "";

test("bots, in two minutes", async ({ demo }) => {
  const page = demo.page;
  const controls = page.getByTestId("controls-card");
  const status = page.getByTestId("status-card");
  const toast = page.getByTestId("toast");
  const nav = (view: string) => page.getByTestId(`nav-${view}`);

  // ── 1 ── Apps ───────────────────────────────────────────────────────────
  await demo.open("/");
  await demo.chapter("Apps");
  const pfa = page.getByTestId("app-card-pfa");
  await expect(pfa).toBeVisible();
  demo.shot("apps");
  await demo.dwell(1200);
  await demo.click(pfa);
  await expect(status).toBeVisible();
  await demo.dwell(1600);

  // ── 2 ── Overview ───────────────────────────────────────────────────────
  await demo.chapter("Overview");
  demo.shot("overview");
  await demo.mark(status);
  await demo.dwell(1000);

  // The load target, 120 → 250: a preset, then Apply; the ramp takes it ten bots at a time.
  await demo.click(controls.getByRole("button", { name: TARGET, exact: true }));
  await expect(page.getByTestId("pending-bar")).toBeVisible();
  await demo.dwell(500);
  await demo.click(page.getByTestId("pending-apply"));
  await expect(toast).toContainText(`Load target applied: ${TARGET}`);
  await demo.mark(controls);
  await demo.dwell(2400);

  // Burst: the chart switches to the last 80 seconds, live.
  await demo.click(controls.getByRole("button", { name: "Burst", exact: true }));
  await expect(toast).toContainText("Load pace: Burst");
  await demo.mark(status);
  await demo.dwell(3200);
  await demo.click(controls.getByRole("button", { name: "Daily", exact: true }));
  await expect(page.getByRole("figure", { name: DAY_CHART })).toBeVisible();
  await demo.dwell(1200);

  // A slice of the day opened: its actions, responses and the bots behind it.
  await demo.click(await busiestSlice(page));
  const slice = page.getByRole("dialog");
  await expect(slice).toBeVisible();
  await demo.dwell(600);
  await demo.mark(slice);
  await demo.dwell(2600);
  await demo.press("Escape");
  await expect(slice).toBeHidden();
  await demo.dwell(600);

  // ── 3 ── Bots ───────────────────────────────────────────────────────────
  await demo.chapter("Bots");
  await demo.click(nav("bots"));
  const bots = page.getByTestId("bots-card");
  await expect(bots).toBeVisible();
  demo.shot("bots");
  await demo.dwell(1200);

  // The degraded ones, and one of them opened in the drawer.
  await demo.click(bots.getByRole("link", { name: /^Degraded/ }));
  await expect(page).toHaveURL(/state=degraded/);
  await demo.dwell(900);
  // The first of them: which bots are degraded right now is the simulation's, not the storyboard's.
  const flaky = bots.locator('[data-testid^="bot-row-legionary-"]').first();
  await expect(flaky).toBeVisible();
  flakyId = ((await flaky.getAttribute("data-testid")) ?? "").replace("bot-row-", "");
  await demo.click(flaky.getByRole("link", { name: flakyId, exact: true }));
  const drawer = page.getByTestId("bot-drawer");
  await expect(drawer).toBeVisible();
  await demo.dwell(600);
  await demo.mark(drawer);
  await demo.dwell(2600);
  await demo.click(drawer.getByRole("button", { name: "Restart session" }));
  await expect(toast).toBeVisible();
  await demo.dwell(1200);
  await demo.press("Escape");
  await expect(drawer).toBeHidden();
  await demo.dwell(500);

  // Ten bots found by name, selected at once, turned off.
  await demo.click(bots.getByRole("link", { name: /^All/ }).last());
  await expect(page).not.toHaveURL(/state=degraded/);
  await demo.click(bots.getByRole("searchbox"));
  await demo.type(QUERY);
  await expect(page).toHaveURL(/q=legionary-01/);
  await expect(page.getByTestId("bot-row-legionary-019")).toBeVisible();
  await demo.dwell(700);
  await demo.click(bots.getByRole("checkbox", { name: "Select all", exact: true }));
  const bulk = page.getByTestId("bulk-bar");
  await expect(bulk).toBeVisible();
  await demo.dwell(600);
  await demo.click(bulk.getByRole("button", { name: "Turn off" }));
  await expect(toast).toContainText("bots turned off");
  await demo.mark(bots);
  await demo.dwell(2000);
  await demo.click(bulk.getByRole("button", { name: "Turn on" }));
  await expect(toast).toContainText("bots turned on");
  await demo.click(bulk.getByRole("button", { name: "Clear selection" }));
  await demo.dwell(600);

  // ── 4 ── Metrics ────────────────────────────────────────────────────────
  await demo.chapter("Metrics");
  await demo.click(nav("metrics"));
  await expect(page.getByText("Response codes")).toBeVisible();
  demo.shot("metrics");
  await demo.dwell(3200);

  // ── 5 ── Actions ────────────────────────────────────────────────────────
  await demo.chapter("Actions");
  await demo.click(nav("actions"));
  const actions = page.getByTestId("actions-card");
  await expect(actions).toBeVisible();
  demo.shot("actions");
  await demo.dwell(1200);
  const upload = page.getByTestId("action-switch-receipt.upload").filter({ visible: true });
  await demo.click(upload);
  await expect(toast).toBeVisible();
  await demo.mark(actions);
  await demo.dwell(2000);
  await demo.click(upload);
  await demo.dwell(900);

  // ── 6 ── Incidents ──────────────────────────────────────────────────────
  await demo.chapter("Incidents");
  await demo.click(nav("incidents"));
  await expect(page.getByTestId("incidents-card")).toBeVisible();
  await demo.dwell(1400);
  const banner = page.getByTestId("incident-banner");
  await demo.mark(banner);
  const row = banner.getByTestId("incident-row").filter({ hasText: COMPROMISED });
  await demo.click(row.getByRole("link", { name: "Disable / purge" }));
  const modal = page.getByTestId("close-account-modal");
  await expect(modal).toBeVisible();
  await demo.dwell(700);
  await demo.mark(modal);
  await demo.click(page.getByTestId("closure-purge"), { dwell: 500 });
  await demo.click(page.getByTestId("close-account-submit"));
  await expect(modal).toBeHidden();
  await expect(banner.getByTestId("incident-row")).toHaveCount(1);
  await demo.mark(page.getByTestId("incidents-card"));
  await demo.dwell(2600);

  // ── Stills ── taken after the take, each on a page of its own (`Demo.shot`).
  demo.shot("incidents");
  demo.shot("day-slice", async (still) => {
    await still.goto(still.url().replace(/\/incidents$/, "/overview"));
    await (await busiestSlice(still)).click();
    await still.getByRole("dialog").waitFor();
  });
  demo.shot("bot-drawer", async (still) => {
    await still.goto(still.url().replace(/\/incidents$/, `/bots/${flakyId}`));
    await still.getByTestId("bot-drawer").waitFor();
  });
  demo.shot("close-account", async (still) => {
    await still.getByTestId("incident-row").getByRole("link", { name: "Disable / purge" }).click();
    await still.getByTestId("close-account-modal").waitFor();
  });
});
