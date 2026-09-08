import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { expect, test } from "@e2e/demo/fixture";
import { dictionaries } from "@text/index";
import format from "date-fns/format";
import subMonths from "date-fns/subMonths";

import type { BrowserContext, Locator, Page } from "@playwright/test";

/**
 * PFA, end to end — one continuous take, six chapters, five screens.
 *
 * This file is the storyboard and nothing else: no pointer paths, no video, no timing arithmetic.
 * Those live in `cursor.ts`, `fixture.ts` and `pacing.ts`, so what is left here reads as a shot
 * list and can be reordered by moving blocks around.
 *
 * Four things it never breaks.
 *
 * IT SIGNS IN ON CAMERA. The film opens on the login form and types the house dev account into
 * it — there is no saved session, the browser is cold on every take. `demo.setup.ts` only puts
 * the account back in French beforehand, because chapter 2 switches it to English and the API
 * remembers.
 *
 * IT ADDRESSES MARKS, NOT WORDS. Every element it touches carries a `data-testid` (PFA-180, the
 * same contract as the other four harnesses), so the storyboard survives a change of label, of
 * class or of language — and the language does change halfway through, when the user menu
 * switches the app to English. The copy modules (`@text`) are read only to check what a bubble
 * or a link says.
 *
 * IT WRITES, INTO THE SEEDED ACCOUNT ONLY. A budget, a weekly ceiling, a fixed expense, a
 * spending, a receipt, a language: six writes, all on `local.dev@mock.io`, all on the current
 * month, and the seeder is what puts more data around them. Nothing is deleted — `Delete` sits
 * beside every `Edit` in this app, so rows are hovered near their text and the modals are left
 * by the keyboard.
 *
 * NOTHING ON SCREEN IS REAL. The account is the house one, the data is the seeder's invented
 * Paris life, the receipt is a picture this file draws itself before the first frame.
 */

const fr = dictionaries.fr;
const en = dictionaries.en;

const USERNAME = process.env.DEMO_USERNAME ?? "";
const PASSWORD = process.env.DEMO_PASSWORD ?? "";

/** The receipt chapter 3 attaches: drawn here, beside the film, gitignored with the rest of `out/`. */
const RECEIPT_DIR = join(__dirname, "out", "upload");
const RECEIPT = join(RECEIPT_DIR, "receipt.png");

/**
 * The label the two searches look for. The seeder's most frequent variable spending, so the
 * whole-history palette fills a screen and the statistics timeline has a bar in most weeks.
 */
const SEARCH_TERM = "biocoop";

/** What the take adds. Invented, and typed in the language the screen is in at that moment. */
const NEW_FIXED = { label: "Salle de sport", amount: "29.90" };
/** An expression, on purpose: the amount field evaluates arithmetic on submit (COS-109). */
const NEW_SPENDING = { label: "Boulangerie du canal", amount: "9.90+2.50" };

/** The number inside a label such as `3 300 €` or `450 €/sem.` — thousands separators and all. */
const digitsOf = (text: string | null) => Number((text ?? "").replace(/\D/g, ""));

/**
 * A card receipt, drawn on a blank page and photographed at the context's scale. Nothing on it
 * is real: an invented shop, a masked number, the amount of the row it will be attached to.
 */
async function drawReceipt(context: BrowserContext, label: string, amount: string): Promise<void> {
  mkdirSync(RECEIPT_DIR, { recursive: true });
  const sheet = await context.newPage();
  await sheet.setViewportSize({ width: 380, height: 640 });
  const today = format(new Date(), "dd/MM/yyyy HH:mm");
  const rows = [
    ["CARTE BANCAIRE", ""],
    ["", ""],
    [label.toUpperCase(), ""],
    ["12 RUE DE L'ECLUSE", ""],
    ["75010 PARIS", ""],
    ["", ""],
    [today, ""],
    ["TICKET CLIENT", ""],
    ["", ""],
    ["CB **** **** **** 4242", ""],
    ["AID: A0000000031010", ""],
    ["MONTANT", `${amount} EUR`],
    ["DEBIT", ""],
    ["", ""],
    ["MERCI DE VOTRE VISITE", ""],
  ];
  await sheet.setContent(`
    <body style="margin:0;background:#e9e6df;display:grid;place-items:center;height:640px">
      <div style="width:300px;padding:28px 22px 34px;background:#fbfaf6;color:#2a2a2a;
                  font:14px/1.9 'Courier New',Courier,monospace;letter-spacing:.02em;
                  box-shadow:0 10px 40px rgba(0,0,0,.18);transform:rotate(-1.2deg)">
        ${rows
          .map(
            ([left, right]) =>
              `<div style="display:flex;justify-content:space-between;white-space:pre">` +
              `<span>${left || " "}</span><span>${right}</span></div>`,
          )
          .join("")}
      </div>
    </body>`);
  await sheet.screenshot({ path: RECEIPT });
  await sheet.close();
}

/**
 * Where on the ring each arc is, in client pixels: the mid-angle of every solid dash plus the
 * empty band that closes the ring. Read off the arcs themselves — their dash array and offset
 * are the geometry the donut hit-tests the cursor against, so a point here always lands.
 */
const donutPoints = (donut: Locator) =>
  donut.evaluate((svg) => {
    const box = svg.getBoundingClientRect();
    const scale = box.width / 100;
    const [, ...arcs] = [...svg.querySelectorAll<SVGCircleElement>(":scope > g:first-of-type > circle")];
    const radius = Number(arcs[0]?.getAttribute("r") ?? 46.5);
    const circumference = 2 * Math.PI * radius;
    const spans = arcs.map((arc) => {
      const dash = Number((arc.getAttribute("stroke-dasharray") ?? "0").split(" ")[0]);
      const offset = -Number(arc.getAttribute("stroke-dashoffset") ?? 0);
      return { start: offset / circumference, end: (offset + dash) / circumference };
    });
    const fractions = spans.map((span) => (span.start + span.end) / 2);
    const lastEnd = spans.length > 0 ? spans[spans.length - 1].end : 0;
    if (lastEnd < 0.995) fractions.push((lastEnd + 1) / 2);
    return fractions.map((fraction) => {
      const angle = fraction * 2 * Math.PI;
      return {
        x: box.left + (50 + radius * Math.sin(angle)) * scale,
        y: box.top + (50 - radius * Math.cos(angle)) * scale,
      };
    });
  });

/** `count` bars of a bar chart, evenly spread along it, as points at mid-height of the band. */
const barStops = (band: Locator, count: number) =>
  band.evaluate((host, wanted) => {
    const box = host.getBoundingClientRect();
    const bars = [...host.querySelectorAll("rect")].map((rect) => rect.getBoundingClientRect());
    if (bars.length === 0) return [] as { x: number; y: number }[];
    const step = bars.length / wanted;
    const picked = Array.from({ length: Math.min(wanted, bars.length) }, (_, i) => bars[Math.floor(i * step)]);
    return picked.map((rect) => ({ x: rect.left + rect.width / 2, y: box.top + box.height * 0.55 }));
  }, count);

test("pfa, end to end", async ({ demo }) => {
  const page = demo.page;
  const todayIso = format(new Date(), "yyyy-MM-dd");

  /**
   * A mark the app renders twice — a desktop copy and a mobile one, hidden from each other by
   * CSS — addressed by the copy on screen. The week picker, the period buttons, the search
   * trigger and the month picker are all like that.
   */
  const visible = (testId: string) => page.getByTestId(testId).filter({ visible: true });
  const navLink = (route: string) =>
    page.locator(`[data-testid="nav-link"][data-route="${route}"]`).filter({ visible: true });

  /**
   * The follow-cursor bubble every graphic answers a hover with (`ui/tooltip`, cursor mode:
   * unmounted when nothing is hovered). Asserted after each hover, so a beat that missed its
   * mark fails the take instead of filming an empty pause.
   */
  const bubble = (text?: string | RegExp) =>
    (text ? page.getByTestId("cursor-tooltip").filter({ hasText: text }) : page.getByTestId("cursor-tooltip")).first();

  /** Walk the pointer along a family of marks, pausing on each. Positional: the count is structural. */
  const sweep = async (marks: Locator, positions: number[], hold: number) => {
    const count = await marks.count();
    for (const index of positions) {
      if (index < count) await demo.moveTo(marks.nth(index), { dwell: hold });
    }
  };

  /**
   * A widget brought to the middle of the window before it is examined — eased, on camera.
   * The statistics page keeps a sticky filter bar over its top 130px: a mark scrolled under it
   * takes no hover, and `moveTo` only scrolls for a point that is off-screen, not for one that
   * is covered.
   */
  const center = async (target: Locator) => {
    await target.evaluate((node) => node.scrollIntoView({ behavior: "smooth", block: "center" }));
    await demo.dwell(1200);
  };

  /**
   * A row of today's card by whether it carries a receipt: the take attaches one to a row
   * without, the still re-opens the row with. A second take on the same day finds the previous
   * take's receipt on the first row and moves on to the next.
   */
  const dayCard = (target: Page) => target.locator(`[data-testid="day-card"][data-sp-day="${todayIso}"]`);
  const receiptRow = (target: Page, hasReceipt: boolean) =>
    dayCard(target).locator(`[data-testid="tx-row"][data-has-receipt="${hasReceipt}"]`).first();

  /**
   * The breakdown row with the most spendings — not the biggest amount, which can be a single
   * purchase with nothing to read behind it. Read off the rows' `data-count`.
   */
  const busiestCategory = async (target: Page): Promise<Locator> => {
    const rows = target.getByTestId("category-row");
    await expect(rows.first()).toBeVisible();
    const counts = await rows.evaluateAll((nodes) => nodes.map((node) => Number(node.getAttribute("data-count") ?? 0)));
    return rows.nth(Math.max(0, counts.indexOf(Math.max(...counts))));
  };

  /** The receipt modal of the row that has one, as the still re-opens it after the take. */
  const openReceipt = async (target: Page): Promise<Locator> => {
    const row = receiptRow(target, true);
    await row.hover();
    await row.getByTestId("tx-receipt").click();
    const dialog = target.getByTestId("receipt-modal");
    await expect(dialog).toBeVisible();
    return dialog;
  };

  await drawReceipt(page.context(), NEW_SPENDING.label, "12.40");

  // ── 1 ── Sign in ─────────────────────────────────────────────────────────
  await demo.open("/login/");
  await demo.chapter("Sign in");

  const signIn = page.getByTestId("login-submit");
  await expect(signIn).toBeVisible();
  await demo.dwell(1400);
  await demo.fill(page.getByTestId("login-email"), USERNAME);
  await demo.fill(page.getByTestId("login-password"), PASSWORD);
  await demo.dwell(400);
  await demo.click(signIn);
  await expect(page).toHaveURL(/\/dashboard/, { timeout: 20_000 });

  // ── 2 ── Dashboard ───────────────────────────────────────────────────────
  await demo.chapter("Dashboard");

  // The gauge draws once the month's budget and its fixed expenses are in: two arcs and the
  // dotted band that completes the ring. Everything on this screen counts up from zero.
  const donut = page.getByTestId("budget-donut");
  await expect(donut).toBeVisible({ timeout: 20_000 });
  await expect
    .poll(() => donut.locator(":scope > g:first-of-type > circle").count(), { timeout: 15_000 })
    .toBeGreaterThanOrEqual(3);
  await demo.dwell(3200);
  demo.shot("dashboard");

  // The three arcs: fixed, variable, what is left. The ring hit-tests the cursor's angle, so
  // the hand is sent to a point on each dash rather than to an element.
  const arcNames = [
    fr.dashboard.budgetHero.fixed,
    fr.dashboard.budgetHero.variables,
    fr.dashboard.budgetHero.available,
  ];
  for (const [index, point] of (await donutPoints(donut)).entries()) {
    await demo.glide(point.x, point.y);
    await expect(bubble(arcNames[index])).toBeVisible();
    await demo.dwell(1100);
  }

  // The month's budget: the amount is a button, the field it becomes selects its content.
  const editBudget = page.getByTestId("budget-edit");
  const budgetNow = digitsOf(await editBudget.textContent());
  await demo.click(editBudget);
  await demo.dwell(350);
  await demo.type(String(budgetNow + 100));
  await demo.dwell(600);
  await demo.press("Enter");
  await expect(editBudget).toBeVisible();
  await demo.dwell(1800);

  // The weekly ceiling, the same way. The bars re-scale against it.
  const editCeiling = page.getByTestId("ceiling-edit");
  const ceilingNow = digitsOf(await editCeiling.textContent());
  await demo.click(editCeiling);
  await demo.dwell(350);
  await demo.type(String(ceilingNow + 30));
  await demo.dwell(600);
  await demo.press("Enter");
  await expect(editCeiling).toBeVisible();
  await demo.dwell(1800);

  // A fixed expense, from the card's own `+`: the same modal as a spending, with the date
  // greyed out and no category — a recurring has neither.
  await demo.click(page.getByTestId("fixed-expense-add"));
  const fixedForm = page.getByTestId("spending-modal");
  await expect(fixedForm).toBeVisible();
  await demo.dwell(700);
  await demo.fill(fixedForm.getByTestId("spending-label"), NEW_FIXED.label);
  await demo.fill(fixedForm.getByTestId("spending-amount"), NEW_FIXED.amount);
  await demo.dwell(600);
  await demo.click(fixedForm.getByTestId("spending-submit"));
  await expect(fixedForm).toHaveCount(0);
  await expect(page.getByTestId("fixed-expense-row").filter({ hasText: NEW_FIXED.label }).first()).toBeVisible({
    timeout: 15_000,
  });
  await demo.dwell(1800);

  // The category breakdown: the bar's segments read, then the row with the most spendings
  // opened, and its detail read without touching a day card, which would navigate.
  await sweep(page.getByTestId("category-bar").getByTestId("bar-segment"), [0, 1, 2], 900);
  await expect(bubble()).toBeVisible();
  await demo.dwell(400);
  await demo.click(await busiestCategory(page), { aim: "text" });
  const detail = page.getByTestId("category-detail");
  await expect(detail).toBeVisible();
  await demo.dwell(1400);
  await sweep(detail.getByTestId("category-detail-day"), [0, 1], 1000);
  await demo.scroll(detail.getByTestId("category-detail-list"), 360, 1400);
  await demo.dwell(900);
  await demo.press("Escape");
  await expect(detail).toHaveCount(0);
  demo.shot("category-detail", async (target) => {
    await (await busiestCategory(target)).click();
    await expect(target.getByTestId("category-detail")).toBeVisible();
  });
  await demo.dwell(600);

  // The month picker, to last month — every widget replays its entrance on a month change, and
  // the take waits for all of it — then the shortcut back to the current month.
  const now = new Date();
  await demo.click(visible("month-picker"));
  await demo.dwell(700);
  await demo.click(page.locator(`[data-testid="month-cell"][data-month="${format(subMonths(now, 1), "yyyy-MM")}"]`));
  await expect(page).toHaveURL(/month=/);
  await demo.dwell(4200);
  await demo.click(visible("current-month"));
  await expect(page).not.toHaveURL(/month=/);
  await demo.dwell(2600);

  // The user menu, and the app switched to English — persisted on the account, which is why
  // `demo.setup.ts` switches it back before the next take. The nav link says so.
  await demo.click(page.getByTestId("user-menu"));
  await demo.dwell(700);
  await demo.click(page.getByTestId("user-menu-language"));
  await demo.dwell(500);
  await demo.click(page.locator('[data-testid="user-menu-locale"][data-locale="en"]'));
  await expect(navLink("spendings")).toHaveText(en.navBar.links.spendings);
  await demo.dwell(1800);

  // ── 3 ── Spendings ───────────────────────────────────────────────────────
  await demo.chapter("Spendings");

  await demo.click(navLink("spendings"));
  const cards = page.getByTestId("day-card");
  await expect(cards.first()).toBeVisible({ timeout: 20_000 });
  await demo.dwell(2400);
  demo.shot("spendings");

  // A spending from the floating button: label, an amount typed as a sum, a category picked
  // from the combobox by its first letters. It lands on today's card.
  await demo.click(page.getByTestId("new-spending"));
  const spendingForm = page.getByTestId("spending-modal");
  await expect(spendingForm).toBeVisible();
  await demo.dwell(600);
  await demo.fill(spendingForm.getByTestId("spending-label"), NEW_SPENDING.label);
  await demo.fill(spendingForm.getByTestId("spending-amount"), NEW_SPENDING.amount);
  await demo.click(spendingForm.getByTestId("spending-category"));
  const options = page.getByTestId("spending-category-option");
  await expect(options.first()).toBeVisible();
  const categoryNames = await options.evaluateAll((nodes) =>
    nodes.map((node) => node.getAttribute("data-category") ?? ""),
  );
  const category = categoryNames[Math.min(1, categoryNames.length - 1)];
  await demo.click(page.getByTestId("spending-category-search"));
  await demo.type(category.slice(0, 3).toLowerCase());
  await demo.dwell(700);
  await demo.click(page.locator(`[data-testid="spending-category-option"][data-category="${category}"]`), {
    aim: "text",
  });
  await expect(spendingForm.getByTestId("spending-category")).toContainText(category, { ignoreCase: true });
  await demo.dwell(600);
  await demo.click(spendingForm.getByTestId("spending-submit"));
  await expect(spendingForm).toHaveCount(0);
  const todayCard = dayCard(page);
  await expect(todayCard.getByTestId("tx-row").filter({ hasText: NEW_SPENDING.label }).first()).toBeVisible({
    timeout: 15_000,
  });
  await demo.dwell(1800);

  // The week picker, two months back to the 15th, and `Today` to come home. Weeks are calendar
  // ranges cut to the month, so the cards change count as well as content. The calendar is
  // `react-day-picker` 7: its arrows and days are the library's own classes.
  await demo.click(visible("week-picker"));
  const previousMonth = page.locator(".DayPicker-NavButton--prev");
  await expect(previousMonth).toBeVisible();
  await demo.dwell(500);
  await demo.click(previousMonth);
  await demo.dwell(500);
  await demo.click(previousMonth);
  await demo.dwell(700);
  await demo.click(page.locator(".DayPicker-Day:not(.DayPicker-Day--outside)").filter({ hasText: /^15$/ }));
  await expect(page).toHaveURL(/date=\d{4}-\d{2}-15/);
  await expect(cards.first()).toBeVisible();
  await demo.dwell(2600);
  await demo.click(visible("today"));
  await expect(page).toHaveURL(new RegExp(`date=${todayIso}`));
  await demo.dwell(1800);

  // A receipt on a spending of the week: the row's actions appear on hover, the modal takes a
  // file through the picker the click raises — the one dialogue Playwright answers for the hand.
  const row = receiptRow(page, false);
  await expect(row, "every row of today's card already carries a receipt — reseed the account").toBeVisible();
  await demo.moveTo(row, { aim: "text", dwell: 700 });
  await demo.click(row.getByTestId("tx-receipt"));
  const invoice = page.getByTestId("receipt-modal");
  await expect(invoice).toBeVisible();
  const chooseFile = invoice.getByTestId("receipt-pick");
  await expect(chooseFile).toBeVisible({ timeout: 15_000 });
  await demo.dwell(900);
  const chooser = page.waitForEvent("filechooser");
  await demo.click(chooseFile);
  await (await chooser).setFiles(RECEIPT);
  const send = invoice.getByTestId("receipt-send");
  await expect(send).toBeVisible();
  await demo.dwell(1400);
  await demo.click(send);
  await expect(invoice.getByTestId("receipt-image")).toBeVisible({ timeout: 30_000 });
  await demo.dwell(2400);
  demo.shot("receipt", async (target) => {
    const dialog = await openReceipt(target);
    await expect(dialog.getByTestId("receipt-image")).toBeVisible({ timeout: 30_000 });
  });
  await demo.press("Escape");
  await expect(invoice).toHaveCount(0);
  await demo.dwell(600);

  // The whole-history search: a shop typed, its rows grouped by month, the list scrolled.
  await demo.click(visible("search-open"));
  const search = page.getByTestId("search-modal");
  await expect(search).toBeVisible();
  await demo.click(search.getByTestId("search-input"));
  await demo.type(SEARCH_TERM);
  await expect(
    search
      .getByTestId("search-result")
      .filter({ hasText: new RegExp(SEARCH_TERM, "i") })
      .first(),
  ).toBeVisible({
    timeout: 15_000,
  });
  await demo.dwell(2200);
  await demo.scroll(search.getByTestId("search-results"), 420, 1400);
  await demo.dwell(900);
  await demo.press("Escape");
  await expect(search).toHaveCount(0);
  await demo.dwell(500);

  // The week's breakdown by category: unfolded if it was not, then its bar read segment by segment.
  const breakdownToggle = page.getByTestId("breakdown-toggle");
  if ((await breakdownToggle.getAttribute("aria-expanded")) === "false") {
    await demo.click(breakdownToggle);
    await demo.dwell(900);
  }
  await sweep(page.getByTestId("week-category-bar").getByTestId("bar-segment"), [0, 1, 2], 900);
  await expect(bubble()).toBeVisible();
  await demo.dwell(600);

  // ── 4 ── Exceptionals ────────────────────────────────────────────────────
  await demo.chapter("Exceptionals");

  await demo.click(navLink("exceptionals"));
  await expect(page).toHaveURL(/exceptionals/);
  const exceptionalItems = page.getByTestId("exceptional-item");
  await expect(exceptionalItems.first()).toBeVisible({ timeout: 20_000 });
  await demo.dwell(2600);
  demo.shot("exceptionals");
  await sweep(exceptionalItems, [0, 1], 900);
  await demo.dwell(800);

  // ── 5 ── Categories ──────────────────────────────────────────────────────
  await demo.chapter("Categories");

  await demo.click(navLink("categories"));
  const categoryTiles = page.getByTestId("category-tile");
  await expect(categoryTiles.first()).toBeVisible({ timeout: 20_000 });
  await demo.dwell(1800);
  demo.shot("categories");
  await sweep(categoryTiles, [0, 1, 4, 7], 700);
  // ⚠️ `Delete` is the button right after `Edit` on every tile. Aimed by its own mark.
  await demo.click(categoryTiles.nth(1).getByTestId("category-edit"));
  const categoryForm = page.getByTestId("category-form");
  await expect(categoryForm).toBeVisible();
  await demo.dwell(2200);
  await demo.press("Escape");
  await expect(categoryForm).toHaveCount(0);
  await demo.dwell(700);

  // ── 6 ── Statistics ──────────────────────────────────────────────────────
  await demo.chapter("Statistics");

  await demo.click(navLink("statistics"));
  const heatmap = page.getByTestId("heatmap");
  await expect(heatmap).toBeVisible({ timeout: 30_000 });
  await demo.dwell(2600);
  demo.shot("statistics");

  // The page, read at a scrolling pace. The wheel goes to whatever is under the pointer, and the
  // sticky filter bar is what stays under it however far the page has gone.
  const scrollAnchor = page.getByTestId("statistics-filters");
  await demo.scroll(scrollAnchor, 520, 1700);
  await demo.dwell(1100);
  await center(heatmap);

  // The heatmap: four days of the year, then the distribution bar under it.
  for (const [dow, week] of [
    [1, 7],
    [3, 14],
    [5, 22],
    [2, 30],
  ]) {
    await demo.moveTo(heatmap.locator(`[data-testid="heatmap-cell"][data-dow="${dow}"][data-week="${week}"]`), {
      dwell: 900,
    });
    await expect(bubble()).toBeVisible();
  }
  await demo.dwell(400);
  await sweep(page.getByTestId("heatmap-distribution-segment"), [0, 1, 2, 3], 800);
  await expect(bubble()).toBeVisible();
  demo.shot("heatmap", async (target) => {
    await target.getByTestId("heatmap").scrollIntoViewIfNeeded();
  });
  await demo.dwell(500);

  // The weekday rhythm: a row's centre is its bar, and the bubble reads the whole row.
  const weekdayPlot = page.getByTestId("weekday-plot");
  await center(weekdayPlot);
  await sweep(weekdayPlot.getByTestId("weekday-row"), [0, 2, 4, 5, 6], 900);
  await expect(bubble(en.statistics.dayOfWeek.days[6])).toBeVisible();
  await demo.dwell(500);

  // The search timeline: a label typed, its bars drawn in, the crosshair walked along them.
  await center(page.getByTestId("search-timeline"));
  await demo.click(page.getByTestId("search-timeline-input"));
  await demo.type(SEARCH_TERM);
  const amountBand = page.getByTestId("search-timeline-amount");
  await expect.poll(() => amountBand.locator("rect").count(), { timeout: 20_000 }).toBeGreaterThan(0);
  await demo.dwell(2200);
  for (const point of await barStops(amountBand, 5)) {
    await demo.glide(point.x, point.y);
    await expect(bubble()).toBeVisible();
    await demo.dwell(900);
  }
  await demo.dwell(800);
  demo.shot("search-timeline", async (target) => {
    await target.getByTestId("search-timeline-input").scrollIntoViewIfNeeded();
    await expect.poll(() => target.getByTestId("search-timeline-amount").locator("rect").count()).toBeGreaterThan(0);
  });

  // ── 7 ── At rest ─────────────────────────────────────────────────────────
  // Off-frame on the same beat, so the pointer's teleport hides under the last hover fading out.
  await demo.park(-40, -40);
  await demo.dwell(2600);
  // One last pointer move, which nobody sees. The screencast emits a frame only when something
  // is drawn and the recorder holds its final frame for a single sixtieth of a second, so on a
  // still closing shot the hold above is what would be lost.
  await demo.park(-41, -41);
});
