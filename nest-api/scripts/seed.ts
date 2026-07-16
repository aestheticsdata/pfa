/**
 * Mock-data seeder for the local demo account `abc@abc.com`.
 *
 * Generates a coherent "Paris life on ~3500 €/month" dataset: monthly budgets,
 * ~12 recurring charges, ~14 categories and thousands of realistic variable
 * spendings, plus a few one-off exceptionals.
 *
 * Two modes, selected on the CLI (the date range is ALWAYS required):
 *
 *   pnpm seed -- --from <YYYY-MM-DD> [--to <YYYY-MM-DD>] [--wipe]
 *
 *   • default (append)  — nothing is deleted. Budgets/recurrings are created
 *     only for months that don't already have them (so monthly totals stay
 *     correct), but SPENDINGS are always generated for every day in the range
 *     and added, even on days that already have spendings. Re-running a range
 *     just piles on more spendings — by design, kept simple.
 *   • --wipe            — deletes ALL of this account's seeded rows first, then
 *     regenerates the whole range from scratch.
 *
 *   --to defaults to today when omitted.
 *
 * The PRNG is seeded per-month, so each month is reproducible on its own.
 *
 * NOTE: this is a standalone tool, not app code — it imports the gitignored
 * generated Prisma client by relative path (no path alias exists for it).
 *
 * See scripts/seeding-guide.md for the full guide.
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { randomUUID } from "node:crypto";

// --- inline .env loader (dotenv is not installed; Node 18 has no --env-file) ---
function loadEnv(): void {
  const raw = readFileSync(resolve(__dirname, "..", ".env"), "utf8");
  for (const line of raw.split("\n")) {
    const m = line.match(/^\s*([\w.]+)\s*=\s*(.*)\s*$/);
    if (!m) continue;
    const value = m[2].replace(/^["']|["']$/g, "");
    if (process.env[m[1]] === undefined) process.env[m[1]] = value;
  }
}
loadEnv();

import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "../generated/prisma/client";

function makePrisma(): PrismaClient {
  const parsed = new URL(process.env.DATABASE_URL as string);
  // Force IPv4: the mariadb driver resolves "localhost" to ::1, where MySQL isn't listening locally.
  const host = parsed.hostname === "localhost" ? "127.0.0.1" : parsed.hostname;
  const adapter = new PrismaMariaDb({
    host,
    port: parseInt(parsed.port || "3306", 10),
    user: decodeURIComponent(parsed.username),
    password: decodeURIComponent(parsed.password),
    database: parsed.pathname.replace("/", ""),
    connectionLimit: 10,
    allowPublicKeyRetrieval: true,
  });
  return new PrismaClient({ adapter });
}

// --------------------------------------------------------------------------
// Constants
// --------------------------------------------------------------------------
const USER_ID = "6c0183a0-9116-11ed-9ee4-d93e666919a2";
const USER_EMAIL = "abc@abc.com";
const CUR = "EUR";

// --------------------------------------------------------------------------
// CLI parsing
// --------------------------------------------------------------------------
/** Year / month (0-based) / day-of-month. */
interface Ymd {
  y: number;
  m: number;
  d: number;
}

class UsageError extends Error {}

const USAGE = `Usage: pnpm seed -- --from <YYYY-MM-DD> [--to <YYYY-MM-DD>] [--wipe]

  --from <YYYY-MM-DD>   Start date (inclusive). Required.
  --to   <YYYY-MM-DD>   End date (inclusive). Defaults to today.
  --wipe                Delete ALL of ${USER_EMAIL}'s seeded rows first, then
                        regenerate the whole range. Without it the script runs
                        in append mode: nothing is deleted, only data missing
                        from the range is added (safe & idempotent).

Examples:
  pnpm seed -- --wipe --from 2023-01-01            # full rebuild up to today
  pnpm seed -- --from 2026-07-08                   # top up since the last run
  pnpm seed -- --from 2025-01-01 --to 2025-03-31   # backfill a window, non-destructive`;

/** Comparable ordinal for a calendar day (m is 0-based). */
const ord = (y: number, m: number, d: number): number => y * 10000 + m * 100 + d;
const pad2 = (n: number): string => String(n).padStart(2, "0");
const fmt = (t: Ymd): string => `${t.y}-${pad2(t.m + 1)}-${pad2(t.d)}`;

function todayYmd(): Ymd {
  const now = new Date();
  return { y: now.getFullYear(), m: now.getMonth(), d: now.getDate() };
}

function parseDate(s: string): Ymd {
  const mm = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  if (!mm) throw new UsageError(`Invalid date "${s}" — expected YYYY-MM-DD.`);
  const y = +mm[1];
  const m = +mm[2] - 1;
  const d = +mm[3];
  const probe = new Date(Date.UTC(y, m, d));
  if (probe.getUTCFullYear() !== y || probe.getUTCMonth() !== m || probe.getUTCDate() !== d) {
    throw new UsageError(`Invalid calendar date "${s}".`);
  }
  return { y, m, d };
}

function parseArgs(argv: string[]): { from: Ymd; to: Ymd; wipe: boolean } {
  let fromStr: string | undefined;
  let toStr: string | undefined;
  let wipe = false;
  for (let i = 0; i < argv.length; i += 1) {
    const a = argv[i];
    const eq = a.indexOf("=");
    const flag = eq === -1 ? a : a.slice(0, eq);
    const inlineVal = eq === -1 ? undefined : a.slice(eq + 1);
    const nextVal = (): string | undefined => inlineVal ?? argv[(i += 1)];
    switch (flag) {
      case "--":
        break; // pnpm forwards the `--` separator literally; ignore it
      case "--wipe":
        wipe = true;
        break;
      case "--from":
        fromStr = nextVal();
        break;
      case "--to":
        toStr = nextVal();
        break;
      case "--help":
      case "-h":
        throw new UsageError("");
      default:
        throw new UsageError(`Unknown argument: ${a}`);
    }
  }
  if (!fromStr) throw new UsageError("Missing required --from.");
  const from = parseDate(fromStr);
  const to = toStr ? parseDate(toStr) : todayYmd();
  if (ord(from.y, from.m, from.d) > ord(to.y, to.m, to.d)) {
    throw new UsageError(`--from (${fromStr}) is after --to (${toStr ?? "today"}).`);
  }
  return { from, to, wipe };
}

// --------------------------------------------------------------------------
// Deterministic PRNG (reseeded per-month) + helpers
// --------------------------------------------------------------------------
let prngState = 0;
function reseed(seed: number): void {
  prngState = seed >>> 0;
}
/** mulberry32 step over the shared, reseedable state. */
function rand(): number {
  prngState |= 0;
  prngState = (prngState + 0x6d2b79f5) | 0;
  let t = Math.imul(prngState ^ (prngState >>> 15), 1 | prngState);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}
/** Per-month seed — makes each month's data reproducible independently of the range. */
const seedFor = (y: number, m: number): number => ((y * 12 + m) * 2654435761) >>> 0;

const rnd = (lo: number, hi: number): number => lo + (hi - lo) * rand();
const round2 = (n: number): number => Math.round(n * 100) / 100;
const pick = <T>(arr: T[]): T => arr[Math.floor(rand() * arr.length)];
function weightedPick<T>(items: T[], weights: number[]): T {
  const total = weights.reduce((s, w) => s + w, 0);
  let r = rand() * total;
  for (let i = 0; i < items.length; i += 1) {
    r -= weights[i];
    if (r <= 0) return items[i];
  }
  return items[items.length - 1];
}
/** Clamp to a Decimal(6,2) column: 0.01 .. 9999.99, 2 decimals. */
const money = (n: number): number => round2(Math.min(9999.99, Math.max(0.01, n)));

// --------------------------------------------------------------------------
// UTC date helpers — @db.Date columns are serialized by UTC calendar day,
// so building dates at UTC midnight avoids an off-by-one in Europe/Paris.
// --------------------------------------------------------------------------
const utc = (y: number, m: number, d: number): Date => new Date(Date.UTC(y, m, d));
const firstOf = (y: number, m: number): Date => utc(y, m, 1);
const lastOf = (y: number, m: number): Date => utc(y, m + 1, 0); // day 0 of next month
const daysIn = (y: number, m: number): number => new Date(Date.UTC(y, m + 1, 0)).getUTCDate();
const weekdayOf = (y: number, m: number, d: number): number => utc(y, m, d).getUTCDay(); // 0=Sun..6=Sat
const monthKey = (y: number, m: number): string => `${y}-${m}`;

function* months(from: Ymd, to: Ymd): Generator<{ y: number; m: number }> {
  let y = from.y;
  let m = from.m;
  while (y < to.y || (y === to.y && m <= to.m)) {
    yield { y, m };
    m += 1;
    if (m > 11) {
      m = 0;
      y += 1;
    }
  }
}

// --------------------------------------------------------------------------
// Category definitions (fixed UUIDs, user-scoped, hex colours ≤ 20 chars)
// share = base fraction of the monthly variable budget; boost = weekend bias.
// --------------------------------------------------------------------------
interface CatDef {
  id: string;
  name: string;
  color: string;
  share: number;
  min: number;
  max: number;
  boost: number;
  labels: string[];
}

const CATS: CatDef[] = [
  { id: "a1000000-0000-4000-8000-000000000001", name: "Alimentation", color: "#6DB65B", share: 0.30, min: 4, max: 85, boost: 1.0,
    labels: ["Franprix", "Monoprix", "Carrefour City", "Naturalia", "Lidl", "Marché Bastille", "Picard", "G20", "Biocoop", "Auchan"] },
  { id: "a1000000-0000-4000-8000-000000000002", name: "Restaurants", color: "#E8663D", share: 0.14, min: 12, max: 70, boost: 1.9,
    labels: ["Le Petit Cambodge", "Big Mamma", "Bouillon Pigalle", "Sushi Shop", "PNY Burger", "Chez Janou", "Deliveroo", "Uber Eats", "Le Bistrot", "Pizzeria Popine"] },
  { id: "a1000000-0000-4000-8000-000000000003", name: "Bar & Café", color: "#C0894B", share: 0.06, min: 3, max: 28, boost: 1.7,
    labels: ["Starbucks", "Café de Flore", "Le Comptoir", "Bar Le Progrès", "Columbus Café", "La Cave à Vins", "Le Baron Rouge"] },
  { id: "a1000000-0000-4000-8000-000000000004", name: "Transport", color: "#4A90D9", share: 0.05, min: 2, max: 45, boost: 1.0,
    labels: ["RATP recharge", "Uber", "G7 Taxi", "Vélib", "SNCF Transilien", "Trainline", "Bolt"] },
  { id: "a1000000-0000-4000-8000-000000000005", name: "Loisirs", color: "#9B59B6", share: 0.07, min: 8, max: 120, boost: 1.6,
    labels: ["UGC Ciné", "MK2", "Fnac Spectacles", "Musée d'Orsay", "Théâtre du Châtelet", "Bowling Mouffetard", "Escape Game", "Steam"] },
  { id: "a1000000-0000-4000-8000-000000000006", name: "Shopping", color: "#E84393", share: 0.11, min: 15, max: 260, boost: 1.3,
    labels: ["Zara", "Uniqlo", "H&M", "Sézane", "Fnac", "Decathlon", "Galeries Lafayette", "Zalando", "Nike Store"] },
  { id: "a1000000-0000-4000-8000-000000000007", name: "Santé", color: "#2ECC71", share: 0.04, min: 6, max: 90, boost: 0.5,
    labels: ["Pharmacie", "Médecin généraliste", "Opticien", "Laboratoire", "Kiné", "Dentiste"] },
  { id: "a1000000-0000-4000-8000-000000000008", name: "Maison", color: "#16A085", share: 0.05, min: 5, max: 190, boost: 1.1,
    labels: ["IKEA", "Leroy Merlin", "Zara Home", "Darty", "BUT", "Truffaut", "Amazon"] },
  { id: "a1000000-0000-4000-8000-000000000009", name: "Voyages", color: "#F39C12", share: 0.03, min: 20, max: 380, boost: 1.0,
    labels: ["SNCF TGV", "Airbnb", "Booking", "Blablacar", "Flixbus", "Trainline"] },
  { id: "a1000000-0000-4000-8000-000000000010", name: "Beauté", color: "#FD79A8", share: 0.03, min: 8, max: 90, boost: 1.2,
    labels: ["Coiffeur", "Institut", "Sephora", "Nocibé", "Marionnaud", "Barbier"] },
  { id: "a1000000-0000-4000-8000-000000000011", name: "Cadeaux", color: "#E74C3C", share: 0.03, min: 10, max: 150, boost: 1.2,
    labels: ["Amazon", "Fnac", "Nature & Découvertes", "Fleuriste", "Le Bon Marché"] },
  { id: "a1000000-0000-4000-8000-000000000012", name: "Sport", color: "#1ABC9C", share: 0.02, min: 5, max: 120, boost: 1.1,
    labels: ["Decathlon", "Nike", "Piscine Pontoise", "Séance escalade", "Yoga studio"] },
  { id: "a1000000-0000-4000-8000-000000000013", name: "Abonnements", color: "#34495E", share: 0.02, min: 3, max: 60, boost: 1.0,
    labels: ["App Store", "Google One", "PlayStation Plus", "Kindle", "Le Monde", "Audible"] },
  { id: "a1000000-0000-4000-8000-000000000014", name: "Banque", color: "#7F8C8D", share: 0.01, min: 2, max: 40, boost: 1.0,
    labels: ["Frais bancaires", "Retrait DAB", "Commission", "Cotisation carte"] },
];

// --------------------------------------------------------------------------
// Recurring definitions (one row per active month). Rent handled separately
// (light year-over-year drift). start = first month the charge is active.
// --------------------------------------------------------------------------
interface RecDef {
  label: string;
  amount: number;
  start?: { y: number; m: number };
}
const RECURRINGS: RecDef[] = [
  { label: "Navigo", amount: 86.4 },
  { label: "EDF électricité", amount: 78 },
  { label: "Box internet Free", amount: 29.99 },
  { label: "Forfait mobile Sosh", amount: 19.99 },
  { label: "Assurance habitation", amount: 14.5 },
  { label: "Mutuelle santé", amount: 42 },
  { label: "Netflix", amount: 13.49 },
  { label: "Spotify", amount: 10.99 },
  { label: "Basic-Fit", amount: 29.99, start: { y: 2024, m: 5 } }, // gym from 2024-06
  { label: "iCloud+", amount: 2.99 },
  { label: "Amazon Prime", amount: 6.99 },
];
const rentForYear = (y: number): number => ({ 2023: 1180, 2024: 1210, 2025: 1250, 2026: 1290 }[y] ?? 1290);

// --------------------------------------------------------------------------
// Exceptionals (inserted when their date falls in the requested range and the
// account doesn't already have one with the same label).
// amount is Decimal(10,2) so no cap concern. categoryName ≤ 50, colour ≤ 20.
// --------------------------------------------------------------------------
interface ExcDef {
  y: number;
  m: number;
  d: number;
  label: string;
  amount: number;
  categoryName: string;
  categoryColor: string;
  description?: string;
}
const EXCEPTIONALS: ExcDef[] = [
  { y: 2023, m: 7, d: 14, label: "Vacances Grèce", amount: 1450, categoryName: "Voyages", categoryColor: "#F39C12", description: "Vol + hôtel Santorin" },
  { y: 2024, m: 6, d: 20, label: "Vacances Portugal", amount: 1650, categoryName: "Voyages", categoryColor: "#F39C12", description: "Séjour Lisbonne + Porto" },
  { y: 2024, m: 10, d: 28, label: "Nouveau smartphone", amount: 1090, categoryName: "Shopping", categoryColor: "#E84393" },
  { y: 2025, m: 4, d: 16, label: "Soins dentaires", amount: 640, categoryName: "Santé", categoryColor: "#2ECC71", description: "Couronne" },
  { y: 2025, m: 8, d: 12, label: "Canapé + meubles salon", amount: 1290, categoryName: "Maison", categoryColor: "#16A085" },
  { y: 2026, m: 0, d: 18, label: "Séjour ski Alpes", amount: 1150, categoryName: "Voyages", categoryColor: "#F39C12", description: "Semaine à Chamonix" },
];

// --------------------------------------------------------------------------
// Seasonality
// --------------------------------------------------------------------------
/** Overall variable-spend multiplier for a month (0-based). */
function seasonalFactor(m: number): number {
  if (m === 11) return 1.18; // December — gifts, restaurants
  if (m === 6 || m === 7) return 1.12; // July/August — travel, going out
  if (m === 0) return 0.94; // January — post-holidays calm
  return 1.0;
}
/** Per-category seasonal share multipliers (before re-normalisation). */
function seasonalShareMult(name: string, m: number): number {
  if (m === 11 && name === "Cadeaux") return 3.2;
  if (m === 11 && name === "Restaurants") return 1.4;
  if (m === 0 && name === "Shopping") return 1.6; // soldes d'hiver
  if (m === 6 && name === "Shopping") return 1.5; // soldes d'été
  if ((m === 6 || m === 7) && name === "Voyages") return 2.2;
  if ((m === 6 || m === 7) && name === "Loisirs") return 1.4;
  return 1.0;
}

/** Pick a day from `days` with weekend bias controlled by `boost`. */
function pickDay(y: number, m: number, days: number[], boost: number): number {
  const at = (): number => days[Math.floor(rand() * days.length)];
  if (days.length === 1) return days[0];
  if (boost <= 1) return at();
  for (let i = 0; i < 12; i += 1) {
    const d = at();
    const wd = weekdayOf(y, m, d);
    const isWeekend = wd === 0 || wd === 5 || wd === 6;
    const w = isWeekend ? boost : 1;
    if (rand() * boost <= w) return d;
  }
  return at();
}

// --------------------------------------------------------------------------
// Existing state (what the account already holds) — drives append decisions.
// After a --wipe these are all empty, so the same code path regenerates fully.
// --------------------------------------------------------------------------
interface Existing {
  categoryIDs: Set<string>;
  dashboardMonths: Set<string>;
  budgetByMonth: Map<string, number>;
  recurringMonths: Set<string>;
  exceptionalLabels: Set<string>;
}

async function loadExisting(prisma: PrismaClient): Promise<Existing> {
  const cats = await prisma.categories.findMany({ where: { userID: USER_ID }, select: { ID: true } });
  const dashes = await prisma.dashboards.findMany({ where: { userID: USER_ID }, select: { dateFrom: true, initialAmount: true } });
  const recs = await prisma.recurrings.findMany({ where: { userID: USER_ID }, select: { dateFrom: true } });
  const excs = await prisma.exceptionals.findMany({ where: { userID: USER_ID }, select: { label: true } });

  const dashboardMonths = new Set<string>();
  const budgetByMonth = new Map<string, number>();
  for (const d of dashes) {
    const from = d.dateFrom as Date;
    const key = monthKey(from.getUTCFullYear(), from.getUTCMonth());
    dashboardMonths.add(key);
    budgetByMonth.set(key, Number(d.initialAmount));
  }
  const recurringMonths = new Set<string>();
  for (const r of recs) {
    const from = r.dateFrom as Date;
    recurringMonths.add(monthKey(from.getUTCFullYear(), from.getUTCMonth()));
  }
  return {
    categoryIDs: new Set(cats.map((c) => c.ID)),
    dashboardMonths,
    budgetByMonth,
    recurringMonths,
    exceptionalLabels: new Set(excs.map((e) => e.label)),
  };
}

// --------------------------------------------------------------------------
// Generation
// --------------------------------------------------------------------------
type Row = Record<string, unknown>;

function generate(
  from: Ymd,
  to: Ymd,
  existing: Existing,
): {
  categoryRows: Row[];
  dashboardRows: Row[];
  recurringRows: Row[];
  spendingRows: Row[];
  exceptionalRows: Row[];
} {
  const categoryRows: Row[] = CATS.filter((c) => !existing.categoryIDs.has(c.id)).map((c) => ({
    ID: c.id,
    userID: USER_ID,
    name: c.name,
    color: c.color,
  }));
  const dashboardRows: Row[] = [];
  const recurringRows: Row[] = [];
  const spendingRows: Row[] = [];

  for (const { y, m } of months(from, to)) {
    reseed(seedFor(y, m));
    const dim = daysIn(y, m);
    const key = monthKey(y, m);

    // Day window this run covers for this month, honoring day-level endpoints.
    const monthFromDay = y === from.y && m === from.m ? from.d : 1;
    const monthToDay = y === to.y && m === to.m ? Math.min(to.d, dim) : dim;

    // --- Monthly budget: reuse the stored one, else pick + create the dashboard ---
    let budget = existing.budgetByMonth.get(key);
    if (budget === undefined) {
      budget = weightedPick([3300, 3400, 3500, 3600], [1, 2, 5, 2]);
      const ceiling = weightedPick([450, 500, 550], [2, 3, 2]);
      dashboardRows.push({
        ID: randomUUID(),
        userID: USER_ID,
        dateFrom: firstOf(y, m),
        dateTo: lastOf(y, m),
        initialAmount: money(budget),
        initialCeiling: money(ceiling),
      });
    }

    // --- Recurrings (full month): deterministic active set; rows only if missing ---
    const active: { label: string; amount: number }[] = [{ label: "Loyer appartement", amount: rentForYear(y) }];
    for (const r of RECURRINGS) {
      if (r.start && (y < r.start.y || (y === r.start.y && m < r.start.m))) continue;
      active.push({ label: r.label, amount: r.amount });
    }
    const recTotal = active.reduce((s, r) => s + r.amount, 0);
    if (!existing.recurringMonths.has(key)) {
      for (const r of active) {
        recurringRows.push({
          ID: randomUUID(),
          userID: USER_ID,
          dateFrom: firstOf(y, m),
          dateTo: lastOf(y, m),
          itemType: "recurring",
          label: r.label,
          amount: money(r.amount),
          currency: CUR,
          invoicefile: null,
        });
      }
    }

    // --- Variable spendings ---
    // Always generate for every day in the requested window and ADD them, no
    // matter what the month already holds. Overlaps are intended: re-running a
    // range simply piles on more spendings (kept deliberately simple).
    const targetDays: number[] = [];
    for (let d = monthFromDay; d <= monthToDay; d += 1) targetDays.push(d);

    // Aim for total (fixed + variable) at 86-100% of budget on normal months;
    // the seasonal factor pushes Dec/summer over budget. The /1.1 compensates
    // for the fill loop's tendency to overshoot each category target slightly.
    const targetRatio = rnd(0.86, 1.0) * seasonalFactor(m);
    const desiredTotal = budget * targetRatio;
    // Full-month variable target, scaled to the number of days in the window.
    const variableTarget = (Math.max(300, (desiredTotal - recTotal) / 1.1) * targetDays.length) / dim;

    // Seasonally-adjusted, re-normalised category shares.
    const adjShares = CATS.map((c) => c.share * seasonalShareMult(c.name, m));
    const shareSum = adjShares.reduce((s, v) => s + v, 0);

    const filledDays = new Set<number>();
    const addSpending = (day: number, cat: CatDef, amt: number): void => {
      spendingRows.push({
        ID: randomUUID(),
        userID: USER_ID,
        date: utc(y, m, day),
        itemType: "spending",
        label: pick(cat.labels),
        amount: amt,
        categoryID: cat.id,
        currency: CUR,
        invoicefile: null,
      });
      filledDays.add(day);
    };

    CATS.forEach((cat, i) => {
      const catTarget = variableTarget * (adjShares[i] / shareSum) * rnd(0.8, 1.2);
      let spent = 0;
      let guard = 0;
      while (spent < catTarget && guard < 80) {
        guard += 1;
        // Skew toward the low end → many small everyday purchases, few large ones.
        const amt = money(cat.min + (cat.max - cat.min) * Math.pow(rand(), 1.9));
        if (spent > 0 && spent + amt > catTarget * 1.2) break;
        addSpending(pickDay(y, m, targetDays, cat.boost), cat, amt);
        spent += amt;
      }
    });

    // Guarantee every day in the window gets at least one spending (no empty days).
    for (const day of targetDays) {
      if (filledDays.has(day)) continue;
      const cat = weightedPick(CATS, adjShares);
      addSpending(day, cat, money(cat.min + (cat.max - cat.min) * Math.pow(rand(), 1.9)));
    }
  }

  const exceptionalRows: Row[] = EXCEPTIONALS.filter(
    (e) => ord(e.y, e.m, e.d) >= ord(from.y, from.m, from.d) && ord(e.y, e.m, e.d) <= ord(to.y, to.m, to.d),
  )
    .filter((e) => !existing.exceptionalLabels.has(e.label))
    .map((e) => ({
      ID: randomUUID(),
      userID: USER_ID,
      date: utc(e.y, e.m, e.d),
      itemType: "exceptional",
      label: e.label,
      description: e.description ?? null,
      amount: round2(e.amount),
      currency: CUR,
      categoryName: e.categoryName,
      categoryColor: e.categoryColor,
      invoicefile: null,
    }));

  return { categoryRows, dashboardRows, recurringRows, spendingRows, exceptionalRows };
}

// --------------------------------------------------------------------------
// Guards & wipe (scoped + guarded + FK-safe). Real exceptionals are kept.
// --------------------------------------------------------------------------
async function guardUser(prisma: PrismaClient): Promise<void> {
  const user = await prisma.users.findUnique({ where: { ID: USER_ID } });
  if (!user || user.email !== USER_EMAIL) {
    throw new Error(`Refusing to run: user guard failed for ${USER_ID} (email=${user?.email ?? "none"})`);
  }
}

async function wipeAll(prisma: PrismaClient): Promise<void> {
  const s = await prisma.spendings.deleteMany({ where: { userID: USER_ID } });
  const r = await prisma.recurrings.deleteMany({ where: { userID: USER_ID } });
  const d = await prisma.dashboards.deleteMany({ where: { userID: USER_ID } });
  const c = await prisma.categories.deleteMany({ where: { userID: USER_ID } });
  // Only remove the exceptionals THIS script seeds (matched by label), so the
  // pre-existing real exceptionals are preserved even on a full wipe.
  const e = await prisma.exceptionals.deleteMany({
    where: { userID: USER_ID, label: { in: EXCEPTIONALS.map((x) => x.label) } },
  });
  console.log(
    `  wiped: spendings=${s.count} recurrings=${r.count} dashboards=${d.count} categories=${c.count} ` +
      `seededExceptionals=${e.count} (real exceptionals kept)`,
  );
}

const chunk = <T>(a: T[], n: number): T[][] =>
  Array.from({ length: Math.ceil(a.length / n) }, (_, i) => a.slice(i * n, i * n + n));

// --------------------------------------------------------------------------
// Verification (range-agnostic all-time summary)
// --------------------------------------------------------------------------
async function verify(prisma: PrismaClient): Promise<void> {
  console.log("\n=== VERIFICATION ===");
  const perYear = (await prisma.$queryRawUnsafe(
    `SELECT YEAR(date) yr, COUNT(*) n, ROUND(SUM(amount)) total,
            DATE_FORMAT(MIN(date),'%Y-%m-%d') mn, DATE_FORMAT(MAX(date),'%Y-%m-%d') mx
     FROM Spendings WHERE userID = '${USER_ID}' GROUP BY yr ORDER BY yr`,
  )) as Array<Record<string, unknown>>;
  console.log("Spendings per year (all-time, raw DATE_FORMAT — proves no off-by-one):");
  for (const r of perYear) console.log(`  ${r.yr}: n=${r.n} total=${r.total}€ range=${r.mn}..${r.mx}`);

  const counts = {
    categories: await prisma.categories.count({ where: { userID: USER_ID } }),
    dashboards: await prisma.dashboards.count({ where: { userID: USER_ID } }),
    recurrings: await prisma.recurrings.count({ where: { userID: USER_ID } }),
    spendings: await prisma.spendings.count({ where: { userID: USER_ID } }),
    exceptionals: await prisma.exceptionals.count({ where: { userID: USER_ID } }),
  };
  console.log("All-time counts:", counts);
}

// --------------------------------------------------------------------------
// Main
// --------------------------------------------------------------------------
async function main(): Promise<void> {
  let opts: { from: Ymd; to: Ymd; wipe: boolean };
  try {
    opts = parseArgs(process.argv.slice(2));
  } catch (err) {
    if (err instanceof UsageError) {
      if (err.message) console.error(`Error: ${err.message}\n`);
      console.error(USAGE);
      process.exit(err.message ? 1 : 0);
    }
    throw err;
  }
  const { from, to, wipe } = opts;

  const prisma = makePrisma();
  try {
    console.log(
      `Seeding ${USER_EMAIL} (${USER_ID})\n` +
        `  mode: ${wipe ? "WIPE + rebuild" : "append (non-destructive)"}, range ${fmt(from)} → ${fmt(to)}`,
    );
    await guardUser(prisma);

    if (wipe) {
      console.log("Wiping this account's seeded rows...");
      await wipeAll(prisma);
    }

    const existing = await loadExisting(prisma);
    const { categoryRows, dashboardRows, recurringRows, spendingRows, exceptionalRows } = generate(from, to, existing);
    console.log(
      `Generated (to insert): categories=${categoryRows.length} dashboards=${dashboardRows.length} ` +
        `recurrings=${recurringRows.length} spendings=${spendingRows.length} exceptionals=${exceptionalRows.length}`,
    );

    console.log("Inserting...");
    if (categoryRows.length) await prisma.categories.createMany({ data: categoryRows as never });
    if (dashboardRows.length) await prisma.dashboards.createMany({ data: dashboardRows as never });
    if (recurringRows.length) await prisma.recurrings.createMany({ data: recurringRows as never });
    if (exceptionalRows.length) await prisma.exceptionals.createMany({ data: exceptionalRows as never });
    for (const c of chunk(spendingRows, 500)) {
      await prisma.spendings.createMany({ data: c as never });
    }

    await verify(prisma);
    console.log("\nDone.");
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
