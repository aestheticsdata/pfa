#!/usr/bin/env node
/**
 * Re-captures the API contract fixtures (PFA-177).
 *
 * Signs in to the LOCAL api with the e2e account (`.env.test.local`), calls every endpoint the
 * front parses, anonymises each response and rewrites `src/schemas/__tests__/fixtures/*.json`.
 * `src/schemas/__tests__/apiContract.test.ts` then parses each fixture with its schema: red means
 * the schema and the api have diverged.
 *
 *   node scripts/captureApiFixtures.mjs
 *
 * Anonymised, never raw: labels, names and descriptions become invented words, amounts invented
 * numbers (a numeric string stays a string — the schemas care), IDs consistent fakes. Dates,
 * colours, counts and years are kept: they carry the shape, not the person. See
 * `docs/api-contract-fixtures.md`.
 */
import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const FIXTURES_DIR = join(ROOT, "src/schemas/__tests__/fixtures");
const API = process.env.CAPTURE_API_URL ?? "http://localhost:6100/api";
const MAX_LIST_ITEMS = 25;

const readEnvFile = (path) => {
  try {
    return Object.fromEntries(
      readFileSync(path, "utf8")
        .split("\n")
        .map((line) => line.match(/^([A-Z0-9_]+)=(.*)$/))
        .filter(Boolean)
        .map(([, key, value]) => [key, value.replace(/^["']|["']$/g, "")]),
    );
  } catch {
    return {};
  }
};

const env = { ...readEnvFile(join(ROOT, ".env.test.local")), ...process.env };
if (!env.E2E_EMAIL || !env.E2E_PASSWORD) {
  throw new Error("E2E_EMAIL / E2E_PASSWORD missing — fill .env.test.local (see .env.test.local.example).");
}

// ---------------------------------------------------------------------------
// Session
// ---------------------------------------------------------------------------

let cookie = "";

const call = async (path, init = {}) => {
  const response = await fetch(`${API}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", Cookie: cookie, ...init.headers },
  });
  const setCookie = response.headers.getSetCookie?.() ?? [];
  if (setCookie.length > 0) cookie = setCookie.map((c) => c.split(";")[0]).join("; ");
  if (!response.ok) throw new Error(`${init.method ?? "GET"} ${path.split("?")[0]} → ${response.status}`);
  return response.json();
};

await call("/users", { method: "POST", body: JSON.stringify({ email: env.E2E_EMAIL, password: env.E2E_PASSWORD }) });

// ---------------------------------------------------------------------------
// Anonymisation
// ---------------------------------------------------------------------------

const WORDS = [
  "Bakery",
  "Train pass",
  "Bookshop",
  "Pharmacy",
  "Cinema",
  "Hardware",
  "Market",
  "Florist",
  "Gym",
  "Stationery",
  "Laundry",
  "Museum",
  "Garden",
  "Repair",
  "Toys",
  "Music",
  "Tea house",
  "Bicycle",
  "Phone plan",
  "Insurance",
  "Rent",
  "Groceries",
  "Transport",
  "Health",
  "Leisure",
  "Home",
  "Gifts",
];
const TEXT_KEYS = new Set([
  "label",
  "detail",
  "groupLabel",
  "description",
  "name",
  "category",
  "categoryName",
  "email",
]);
const ID_KEYS = new Set(["ID", "id", "userID", "categoryID", "groupID", "nextCursor"]);
const AMOUNT_KEYS = new Set([
  "amount",
  "total",
  "value",
  "previousValue",
  "previousTotal",
  "drawn",
  "monthlyAverage",
  "initialAmount",
  "initialCeiling",
  "spendingsSum",
  "recurringsSum",
  "totalSpent",
  "income",
  "dailyTotals",
]);

const words = new Map();
const fakeWord = (real) => {
  if (!words.has(real)) {
    const n = words.size;
    words.set(real, n < WORDS.length ? WORDS[n] : `${WORDS[n % WORDS.length]} ${Math.floor(n / WORDS.length) + 1}`);
  }
  return words.get(real);
};

const ids = new Map();
const fakeId = (real) => {
  if (!ids.has(real)) ids.set(real, `00000000-0000-4000-8000-${String(ids.size + 1).padStart(12, "0")}`);
  return ids.get(real);
};

let seed = 177;
const fakeAmount = (real) => {
  if (real === null || real === undefined || real === "") return real;
  seed = (seed * 9301 + 49297) % 233280;
  const invented = Math.round((seed / 233280) * 30000) / 100;
  if (typeof real === "string") return invented.toFixed(2);
  return Number.isInteger(real) ? Math.round(invented) : invented;
};

const anonymize = (value, key) => {
  if (Array.isArray(value)) {
    // Long lists of rows are cut: a few dozen carry every shape, the rest is only diff noise.
    const rows = value.some((item) => item !== null && typeof item === "object")
      ? value.slice(0, MAX_LIST_ITEMS)
      : value;
    return rows.map((item) => anonymize(item, key));
  }
  if (value !== null && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, anonymize(v, k)]));
  }
  if (value === null) return null;
  if (key === "csrfToken") return "csrf-token";
  if (key === "email") return "user@example.test";
  if (key === "invoicefile") return "receipt.jpg";
  if (key === "spendingIDs" || ID_KEYS.has(key)) return fakeId(value);
  if (TEXT_KEYS.has(key) && typeof value === "string") return fakeWord(value);
  if (AMOUNT_KEYS.has(key)) return fakeAmount(value);
  return value;
};

// /statistics is keyed by the user's own category names, at two levels.
const anonymizeStatistics = ({ colors, data }) => ({
  colors: Object.fromEntries(Object.entries(colors).map(([name, color]) => [fakeWord(name), color])),
  data: Object.fromEntries(
    Object.entries(data).map(([year, rows]) => [
      year,
      rows.map(({ month, ...totals }) => ({
        month,
        ...Object.fromEntries(Object.entries(totals).map(([name, v]) => [fakeWord(name), fakeAmount(v)])),
      })),
    ]),
  ),
});

// ---------------------------------------------------------------------------
// Calendar — the latest month with data, the very first one, and an empty one
// ---------------------------------------------------------------------------

const pad = (n) => String(n).padStart(2, "0");
const ymd = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const monthStart = (y, m) => new Date(y, m, 1);
const monthEnd = (y, m) => new Date(y, m + 1, 0);
// The front sends `${date}` — a Date's toString — on the older endpoints; replay it as-is.
const dateParam = (d) => encodeURIComponent(d.toString());

const years = await call("/spendings/years");
const latestYear = years[0];
const firstYear = years[years.length - 1];
const latestDays = (await call(`/daily-stats?year=${latestYear}`)).days;
const firstDays = (await call(`/daily-stats?year=${firstYear}`)).days;
const latest = new Date(`${latestDays[latestDays.length - 1].date.slice(0, 10)}T00:00:00`);
const first = new Date(`${firstDays[0].date.slice(0, 10)}T00:00:00`);
const EMPTY_YEAR = 2099;

const months = {
  latest: [latest.getFullYear(), latest.getMonth()],
  first: [first.getFullYear(), first.getMonth()],
  empty: [EMPTY_YEAR, 0],
};

const monthQuery = ([y, m]) => `userID=x&from=${dateParam(monthStart(y, m))}&to=${dateParam(monthEnd(y, m))}`;
const startQuery = ([y, m]) => `userID=x&start=${dateParam(monthStart(y, m))}`;
const isoStart = ([y, m]) => ymd(monthStart(y, m));
const trendsQuery = ([y, m]) =>
  new URLSearchParams({
    from: ymd(monthStart(y, m)),
    to: ymd(monthEnd(y, m)),
    prevFrom: ymd(monthStart(y, m - 1)),
    prevTo: ymd(monthEnd(y, m - 1)),
  });

const latestSpendings = await call(`/spendings?${monthQuery(months.latest)}`);
const term = latestSpendings.find((s) => s.label.length >= 3)?.label.slice(0, 3) ?? "a";
const categories = await call("/categories?userID=x");
const firstSearchPage = await call(`/spendings/search?q=${encodeURIComponent(term)}`);
const today = new Date();
const yearAgo = new Date(today.getFullYear() - 1, today.getMonth(), today.getDate() + 1);

// ---------------------------------------------------------------------------
// Fixtures — the name is the key `apiContract.test.ts` maps to a schema
// ---------------------------------------------------------------------------

const ENDPOINTS = {
  "auth.me": "/users/me",
  "categories.list": "/categories?userID=x",
  "categoryStats.all": "/category-stats",
  "categoryStats.range": `/category-stats?from=${latestYear}-01-01&to=${ymd(latest)}`,
  "dashboard.month": `/dashboard?${startQuery(months.latest)}`,
  "dashboard.emptyMonth": `/dashboard?${startQuery(months.empty)}`,
  "dashboard.projection": `/dashboard/projection?${startQuery(months.latest)}`,
  "dashboard.projectionFirstMonth": `/dashboard/projection?${startQuery(months.first)}`,
  "dashboard.monthlyIncome": `/dashboard/monthly-income?year=${latestYear}`,
  "dashboard.monthlyStats": `/monthlystats?userID=x&from=${dateParam(monthStart(...months.latest))}`,
  "dashboard.weeklyStats": `/weeklystats?${startQuery(months.latest)}`,
  "exceptionals.year": `/exceptionals?year=${latestYear}`,
  "exceptionals.all": "/exceptionals",
  "exceptionals.years": "/exceptionals/years",
  "exceptionals.regularMonthlyAverage": `/regular-monthly-average?year=${latestYear}`,
  "recurrings.month": `/recurrings?${startQuery(months.latest)}`,
  "recurrings.drawn": `/recurrings/drawn?year=${latestYear}&month=${months.latest[1] + 1}`,
  "spendings.month": `/spendings?${monthQuery(months.latest)}`,
  "spendings.emptyMonth": `/spendings?${monthQuery(months.empty)}`,
  "spendings.years": "/spendings/years",
  "spendings.search": `/spendings/search?q=${encodeURIComponent(term)}`,
  ...(firstSearchPage.nextCursor
    ? {
        "spendings.searchNextPage": `/spendings/search?q=${encodeURIComponent(term)}&cursor=${encodeURIComponent(firstSearchPage.nextCursor)}`,
      }
    : {}),
  "spendings.searchYear": `/spendings/search?q=&year=${latestYear}`,
  "spendings.labelSuggestions": `/spendings/label-suggestions?q=${encodeURIComponent(term.slice(0, 2))}`,
  "stats.busiestWeek": `/busiest-week?start=${isoStart(months.latest)}`,
  "stats.busiestWeekEmptyMonth": `/busiest-week?start=${isoStart(months.empty)}`,
  "stats.spendingPace": `/spending-pace?start=${isoStart(months.latest)}`,
  "stats.categoryTrends": `/category-trends?${trendsQuery(months.latest)}`,
  "stats.categoryTrendsFirstMonth": `/category-trends?${trendsQuery(months.first)}`,
  "stats.dailyStats": `/daily-stats?year=${latestYear}`,
  "stats.dailyStatsEmptyYear": `/daily-stats?year=${EMPTY_YEAR}`,
  "stats.weekdayCategories": `/weekday-categories?year=${latestYear}`,
  "stats.biggestRegularExpense": `/biggest-regular-expense?year=${latestYear}`,
  "stats.biggestRegularExpenseEmptyYear": `/biggest-regular-expense?year=${EMPTY_YEAR}`,
  "stats.statistics": `/statistics?years=${years.slice(0, 2).join(",")}&categories=${categories.map((c) => c.ID).join(",")}`,
  "stats.searchTimelineDay": `/search-timeline?q=${encodeURIComponent(term)}&from=${ymd(new Date(today.getFullYear(), today.getMonth() - 1, today.getDate() + 1))}&to=${ymd(today)}&bucket=day`,
  "stats.searchTimelineWeek": `/search-timeline?q=${encodeURIComponent(term)}&from=${ymd(yearAgo)}&to=${ymd(today)}&bucket=week`,
};

for (const [name, path] of Object.entries(ENDPOINTS)) {
  const response = await call(path);
  const fixture =
    name === "stats.statistics"
      ? anonymizeStatistics(response)
      : // /weeklystats is a bare array of amounts, with no key to recognise them by.
        anonymize(response, name === "dashboard.weeklyStats" ? "total" : null);
  writeFileSync(join(FIXTURES_DIR, `${name}.json`), `${JSON.stringify(fixture, null, 2)}\n`);
  console.log(`✓ ${name}`);
}

// Written in the repo's own format, so a re-capture diffs only on what the api changed.
execFileSync(join(ROOT, "node_modules/.bin/biome"), ["format", "--write", FIXTURES_DIR], { stdio: "inherit" });
