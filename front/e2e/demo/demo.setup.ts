import { execFileSync } from "node:child_process";
import { join } from "node:path";
import { expect, test as setup } from "@playwright/test";
import format from "date-fns/format";
import startOfMonth from "date-fns/startOfMonth";

/**
 * Putting the account back the way the take expects to find it.
 *
 * The take signs in on camera, so this project saves no session for it. What it does is undo what
 * the previous take changed that the next one would inherit, and set up what the take shows:
 *
 * - THE DATA, UP TO TODAY. The take films today's card, today's month, today's statistics, and
 *   the seeder only fills the account up to the day it last ran. So the seeder runs first, in
 *   `--top-up` mode: from the day after the account's last spending to today, whatever the gap —
 *   two weeks or six months — and nothing at all when it is already current
 *   (`nest-api/docs/seeding.md`). It also opens a new month's budget, which the next step needs.
 * - THE LANGUAGE. The storyboard switches the app to English through the user menu as soon as the
 *   dashboard is up, and the API persists that on the account (`PATCH /users/me`), where it wins
 *   over anything the browser remembers — a take started on that account would open in English,
 *   and the switch the film shows would switch nothing.
 * - THE MONTH IN THE GREEN. The seeder's invented Paris life spends close to 4,000 € a month, and
 *   every take adds to it, so late in a month the seeded budget is overdrawn and the dashboard
 *   opens on a red balance, "over budget" — the wrong first frame for a portfolio film. The
 *   current month's budget and weekly ceiling are set above that. The take then edits both, from
 *   there.
 *
 * Through the API rather than the database: the same calls the user menu and the inline edits
 * make, on the same guards. The house dev account, never anything real — the film is for a public
 * page.
 *
 * ⚠️ PFA keeps ONE live session per account: every sign-in — this one, then the take's own —
 * revokes the others (`nest-api/src/users/users.controller.ts`). Your own tab on `local.dev@mock.io`
 * is signed out the moment a take starts, and a sign-in of yours mid-take 401s every request the
 * film makes.
 */
const API_URL = process.env.DEMO_API_URL ?? "http://localhost:6100";

/** The current month's budget and weekly ceiling, in euros: above what the seeded month spends. */
const MONTH = { budget: 4600, ceiling: 650 };

/** The API's package, beside the front's in the repository — where `pnpm seed` runs. */
const NEST_API = join(__dirname, "..", "..", "..", "nest-api");

setup("top the dev account up to today, back in French, its month in the green", async ({ request }) => {
  const username = process.env.DEMO_USERNAME;
  const password = process.env.DEMO_PASSWORD;
  setup.skip(!username || !password, "set DEMO_USERNAME and DEMO_PASSWORD in .env.test.local");

  // Output shown as it comes: a gap of months is a few seconds of inserts, and says so.
  execFileSync("pnpm", ["seed", "--", "--top-up"], { cwd: NEST_API, stdio: "inherit" });

  // Sign-in needs no CSRF token; it hands one back, and the session cookie it sets rides on
  // this request context for the calls that follow.
  const signIn = await request.post(`${API_URL}/api/users`, { data: { email: username, password } });
  expect(signIn.ok(), `sign-in as ${username} answered ${signIn.status()} — check .env.test.local`).toBeTruthy();
  const { csrfToken } = (await signIn.json()) as { csrfToken: string };
  const headers = { "x-csrf-token": csrfToken };

  const patch = await request.patch(`${API_URL}/api/users/me`, { data: { language: "fr" }, headers });
  expect(patch.ok(), `PATCH /users/me answered ${patch.status()}`).toBeTruthy();

  // The month is addressed by its first day as a bare `yyyy-MM-dd`. `dateFrom` is a DATE column,
  // compared at UTC midnight: a local midnight in Paris is the previous day there, and finds
  // nothing.
  const start = format(startOfMonth(new Date()), "yyyy-MM-dd");
  const month = await request.get(`${API_URL}/api/dashboard?start=${start}`, { headers });
  expect(month.ok(), `GET /dashboard answered ${month.status()}`).toBeTruthy();
  const dashboard = (await month.json()) as { ID: string } | null;
  expect(dashboard, "the current month has no budget yet — top the seed up to today").not.toBeNull();

  const put = await request.put(`${API_URL}/api/dashboard/${dashboard?.ID}`, {
    data: { amount: MONTH.budget, ceiling: MONTH.ceiling },
    headers,
  });
  expect(put.ok(), `PUT /dashboard answered ${put.status()}`).toBeTruthy();
});
