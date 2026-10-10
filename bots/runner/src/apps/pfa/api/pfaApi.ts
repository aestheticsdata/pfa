import { assertKnownReceipt } from "@apps/pfa/receipts/receiptImages";
import { HTTP_METHOD } from "@core/constants/http";
import { BotBlockedError, SessionExpiredError } from "@core/engine/errors";

import type { MonthRange, ReceiptUpload, SignInBody } from "@apps/pfa/interfaces/pfaTypes";
import type { AppClient } from "@core/http/appClient";
import type { AuthSession } from "@core/interfaces/appTypes";
import type { HttpResponse } from "@core/interfaces/httpTypes";
// The API's own DTO is the source of truth for the payload: when the back changes, this stops compiling.
import type { CreateSpendingDto } from "@pfa-api/spendings/dto/create-spending.dto";

const UNKNOWN_USER = "User does not exist";
const CSRF_REFUSED = "Invalid CSRF token";

/**
 * Typed client for the PFA routes the bots use — the very routes the front calls, over the public
 * URL. Any 401 means the session is gone; any 403 means PFA refuses this bot (the IP lock of
 * PFA-122, or a disabled account): the runner stops retrying it.
 */
export async function authenticate(session: AuthSession): Promise<void> {
  const { bot, client, password } = session;
  const signIn = await client.post<SignInBody>("/users", { email: bot.email, password });
  if (signIn.status === 200) {
    client.setCsrfToken(signIn.body?.csrfToken);
    return;
  }
  if (signIn.status === 401 && signIn.body?.message === UNKNOWN_USER) {
    const signUp = await client.post<SignInBody>("/users/add", {
      name: bot.id,
      email: bot.email,
      password,
      baseCurrency: "EUR",
      language: "fr",
    });
    if (signUp.status === 201) {
      client.setCsrfToken(signUp.body?.csrfToken);
      return;
    }
    throw new BotBlockedError(`sign-up refused (${signUp.status})`);
  }
  // A wrong password means the runner lost this bot's secret: retrying will not fix it.
  throw new BotBlockedError(`sign-in refused (${signIn.status})`);
}

export async function createSpending(client: AppClient, dto: CreateSpendingDto): Promise<string> {
  const res = await client.post<{ ID: string }>("/spendings", dto);
  return expectOk(res, "create spending").ID;
}

/** Multipart in the order PFA's upload expects: the fields its file name is built from, then the file. */
export async function uploadReceipt(client: AppClient, upload: ReceiptUpload): Promise<void> {
  await assertKnownReceipt(upload.image);
  const form = new FormData();
  form.append("spendingID", upload.spending.ID);
  form.append("itemType", "spending");
  form.append("date", upload.spending.date);
  form.append("label", upload.spending.label);
  form.append(
    "invoiceImageUpload",
    new Blob([new Uint8Array(upload.image.bytes)], { type: "image/jpeg" }),
    upload.image.name,
  );
  expectOk(await client.send({ method: HTTP_METHOD.post, path: "/spendings/upload", form }), "upload receipt");
}

/** What the dashboard page loads for a month. */
export async function readDashboard(client: AppClient, month: MonthRange): Promise<void> {
  expectOk(await client.get(`/dashboard?start=${month.from}`), "dashboard");
  expectOk(await client.get(`/dashboard/projection?start=${month.from}`), "projection");
  expectOk(await client.get(`/spendings?from=${month.from}&to=${month.to}`), "spendings");
  expectOk(await client.get(`/weeklystats?start=${month.from}`), "weekly stats");
  expectOk(await client.get("/categories"), "categories");
}

/** What the statistics page loads for a year. */
export async function readStatistics(client: AppClient, year: number): Promise<void> {
  expectOk(await client.get(`/monthlystats?from=${year}-01-01`), "monthly stats");
  expectOk(await client.get(`/daily-stats?year=${year}`), "daily stats");
  expectOk(await client.get(`/weekday-categories?year=${year}`), "weekday categories");
  expectOk(await client.get(`/regular-monthly-average?year=${year}`), "regular average");
}

function expectOk<T>(res: HttpResponse<T>, what: string): T {
  if (res.status === 401) {
    throw new SessionExpiredError(`${what}: session expired`);
  }
  if (res.status === 403) {
    // A stale CSRF token is a session problem (sign in again), anything else is PFA refusing the bot.
    const message = (res.body as { message?: unknown } | undefined)?.message;
    if (message === CSRF_REFUSED) {
      throw new SessionExpiredError(`${what}: CSRF token refused`);
    }
    throw new BotBlockedError(`${what}: refused by the app`);
  }
  if (res.status < 200 || res.status >= 300) {
    throw new Error(`${what}: HTTP ${res.status}`);
  }
  return res.body;
}
