/**
 * One-off mock-data seeder for the local demo account `abc@abc.com`.
 *
 * Generates a coherent "Paris life on ~3500 €/month" dataset spread over
 * 2023-01 → 2026-07-08 (today): monthly budgets, ~12 recurring charges,
 * ~14 categories and thousands of realistic variable spendings, plus a few
 * one-off exceptionals.
 *
 * Strategy: wipe this account's placeholder rows (scoped + guarded), then
 * bulk-insert fresh data. Deterministic (seeded PRNG) so re-runs reproduce.
 *
 * Run from nest-api/ (or `pnpm seed`):
 *   TS_NODE_TRANSPILE_ONLY=1 \
 *   TS_NODE_COMPILER_OPTIONS='{"module":"CommonJS","moduleResolution":"Node","resolvePackageJsonExports":false}' \
 *   node -r ts-node/register scripts/seed.ts
 *
 * It is idempotent: re-running wipes this account's seeded rows and rebuilds
 * the same dataset (fixed PRNG seed).
 *
 * NOTE: this is a standalone tool, not app code — it imports the gitignored
 * generated Prisma client by relative path (no path alias exists for it).
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

const RANGE_START = { y: 2023, m: 0 }; // 2023-01 (m is 0-based)
const RANGE_END = { y: 2026, m: 6 }; //   2026-07
const TODAY = { y: 2026, m: 6, d: 8 }; // 2026-07-08 — daily-spending cutoff

// --------------------------------------------------------------------------
// Deterministic PRNG + helpers
// --------------------------------------------------------------------------
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rand = mulberry32(20240101);
const rnd = (lo: number, hi: number): number => lo + (hi - lo) * rand();
const rndInt = (lo: number, hi: number): number => Math.floor(rnd(lo, hi + 1));
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

function* months(): Generator<{ y: number; m: number }> {
  let { y, m } = RANGE_START;
  while (y < RANGE_END.y || (y === RANGE_END.y && m <= RANGE_END.m)) {
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
const rentForYear = (y: number): number => ({ 2023: 1180, 2024: 1210, 2025: 1250, 2026: 1290 }[y] ?? 1250);

// --------------------------------------------------------------------------
// Exceptionals (added; the 2 pre-existing real ones — Japan, MacBook — stay).
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

/** Pick a day in [1, lastDay] with weekend bias controlled by `boost`. */
function pickDay(y: number, m: number, lastDay: number, boost: number): number {
  if (boost <= 1) return rndInt(1, lastDay);
  for (let i = 0; i < 12; i += 1) {
    const d = rndInt(1, lastDay);
    const wd = weekdayOf(y, m, d);
    const isWeekend = wd === 0 || wd === 5 || wd === 6;
    const w = isWeekend ? boost : 1;
    if (rand() * boost <= w) return d;
  }
  return rndInt(1, lastDay);
}

// --------------------------------------------------------------------------
// Row types (loose — validated by Prisma on insert)
// --------------------------------------------------------------------------
type Row = Record<string, unknown>;

function generate(): {
  categoryRows: Row[];
  dashboardRows: Row[];
  recurringRows: Row[];
  spendingRows: Row[];
  exceptionalRows: Row[];
} {
  const categoryRows: Row[] = CATS.map((c) => ({ ID: c.id, userID: USER_ID, name: c.name, color: c.color }));
  const dashboardRows: Row[] = [];
  const recurringRows: Row[] = [];
  const spendingRows: Row[] = [];

  for (const { y, m } of months()) {
    const dim = daysIn(y, m);
    const isPartial = y === TODAY.y && m === TODAY.m;
    const lastDay = isPartial ? TODAY.d : dim;

    // --- Monthly budget ---
    const budget = weightedPick([3300, 3400, 3500, 3600], [1, 2, 5, 2]);
    const ceiling = weightedPick([450, 500, 550], [2, 3, 2]);
    dashboardRows.push({
      ID: randomUUID(),
      userID: USER_ID,
      dateFrom: firstOf(y, m),
      dateTo: lastOf(y, m),
      initialAmount: money(budget),
      initialCeiling: money(ceiling),
    });

    // --- Recurrings (full month) ---
    let recTotal = 0;
    const active: { label: string; amount: number }[] = [{ label: "Loyer appartement", amount: rentForYear(y) }];
    for (const r of RECURRINGS) {
      if (r.start && (y < r.start.y || (y === r.start.y && m < r.start.m))) continue;
      active.push({ label: r.label, amount: r.amount });
    }
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
      recTotal += r.amount;
    }

    // --- Variable spendings target ---
    // Aim for total (fixed + variable) at 86-100% of budget on normal months;
    // the seasonal factor pushes Dec/summer over budget. The /1.1 compensates
    // for the fill loop's tendency to overshoot each category target slightly.
    const targetRatio = rnd(0.86, 1.0) * seasonalFactor(m);
    const desiredTotal = budget * targetRatio;
    let variableTarget = Math.max(300, (desiredTotal - recTotal) / 1.1);
    if (isPartial) variableTarget *= lastDay / dim;

    // Seasonally-adjusted, re-normalised category shares.
    const adjShares = CATS.map((c) => c.share * seasonalShareMult(c.name, m));
    const shareSum = adjShares.reduce((s, v) => s + v, 0);

    CATS.forEach((cat, i) => {
      const catTarget = variableTarget * (adjShares[i] / shareSum) * rnd(0.8, 1.2);
      let spent = 0;
      let guard = 0;
      while (spent < catTarget && guard < 80) {
        guard += 1;
        // Skew toward the low end → many small everyday purchases, few large ones.
        const amt = money(cat.min + (cat.max - cat.min) * Math.pow(rand(), 1.9));
        if (spent > 0 && spent + amt > catTarget * 1.2) break;
        const day = pickDay(y, m, lastDay, cat.boost);
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
        spent += amt;
      }
    });
  }

  const exceptionalRows: Row[] = EXCEPTIONALS.map((e) => ({
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
// Wipe (scoped + guarded + FK-safe). Exceptionals are intentionally kept.
// --------------------------------------------------------------------------
async function wipe(prisma: PrismaClient): Promise<void> {
  const user = await prisma.users.findUnique({ where: { ID: USER_ID } });
  if (!user || user.email !== USER_EMAIL) {
    throw new Error(`Refusing to wipe: user guard failed for ${USER_ID} (email=${user?.email ?? "none"})`);
  }
  const s = await prisma.spendings.deleteMany({ where: { userID: USER_ID } });
  const r = await prisma.recurrings.deleteMany({ where: { userID: USER_ID } });
  const d = await prisma.dashboards.deleteMany({ where: { userID: USER_ID } });
  const c = await prisma.categories.deleteMany({ where: { userID: USER_ID } });
  // Only remove the exceptionals THIS script seeds (matched by label), so re-runs
  // stay idempotent while the pre-existing real exceptionals are preserved.
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
// Verification
// --------------------------------------------------------------------------
async function verify(prisma: PrismaClient): Promise<void> {
  console.log("\n=== VERIFICATION ===");

  const perYear = (await prisma.$queryRawUnsafe(
    `SELECT YEAR(date) yr, COUNT(*) n, ROUND(SUM(amount)) total,
            DATE_FORMAT(MIN(date),'%Y-%m-%d') mn, DATE_FORMAT(MAX(date),'%Y-%m-%d') mx
     FROM Spendings WHERE userID = '${USER_ID}' GROUP BY yr ORDER BY yr`,
  )) as Array<Record<string, unknown>>;
  console.log("Spendings per year (raw DATE_FORMAT — proves no off-by-one):");
  for (const r of perYear) console.log(`  ${r.yr}: n=${r.n} total=${r.total}€ range=${r.mn}..${r.mx}`);

  const dashCheck = (await prisma.$queryRawUnsafe(
    `SELECT COUNT(*) n, SUM(DAY(dateFrom)=1) day1
     FROM Dashboards WHERE userID = '${USER_ID}'`,
  )) as Array<Record<string, unknown>>;
  console.log(`Dashboards: n=${dashCheck[0].n} (all dateFrom day 01: ${dashCheck[0].day1})`);

  const recCheck = (await prisma.$queryRawUnsafe(
    `SELECT COUNT(*) n, SUM(DAY(dateFrom)=1) df1, SUM(dateTo=LAST_DAY(dateFrom)) dtok
     FROM Recurrings WHERE userID = '${USER_ID}'`,
  )) as Array<Record<string, unknown>>;
  console.log(`Recurrings: n=${recCheck[0].n} (dateFrom day 01: ${recCheck[0].df1}, dateTo = last-of-month: ${recCheck[0].dtok})`);

  // App code-path checks (same queries the UI runs)
  const dash = await prisma.dashboards.findFirst({ where: { userID: USER_ID, dateFrom: utc(2025, 2, 1) } });
  const recSum = await prisma.recurrings.aggregate({
    where: { userID: USER_ID, dateFrom: utc(2025, 2, 1), dateTo: utc(2025, 2, 31) },
    _sum: { amount: true },
  });
  const buckets = await prisma.spendings.groupBy({
    by: ["categoryID"],
    where: { userID: USER_ID, date: { gte: utc(2025, 2, 1), lte: utc(2025, 2, 31) } },
    _sum: { amount: true },
  });
  console.log(
    `App paths (March 2025): getDashboard→${dash ? `budget ${dash.initialAmount}€, ceiling ${dash.initialCeiling}€` : "NULL"}; ` +
      `recurringsSum=${Number(recSum._sum.amount ?? 0)}€; spending category buckets=${buckets.length}`,
  );

  // Budget fit: how do monthly (spendings + recurrings) totals sit vs the budget?
  const spByM = (await prisma.$queryRawUnsafe(
    `SELECT DATE_FORMAT(date,'%Y-%m') ym, SUM(amount) v FROM Spendings WHERE userID='${USER_ID}' GROUP BY ym`,
  )) as Array<{ ym: string; v: unknown }>;
  const recByM = (await prisma.$queryRawUnsafe(
    `SELECT DATE_FORMAT(dateFrom,'%Y-%m') ym, SUM(amount) r FROM Recurrings WHERE userID='${USER_ID}' GROUP BY ym`,
  )) as Array<{ ym: string; r: unknown }>;
  const budByM = (await prisma.$queryRawUnsafe(
    `SELECT DATE_FORMAT(dateFrom,'%Y-%m') ym, initialAmount b FROM Dashboards WHERE userID='${USER_ID}'`,
  )) as Array<{ ym: string; b: unknown }>;
  const recMap = new Map(recByM.map((x) => [x.ym, Number(x.r)]));
  const budMap = new Map(budByM.map((x) => [x.ym, Number(x.b)]));
  let over = 0;
  let ratioSum = 0;
  let counted = 0;
  for (const s of spByM) {
    if (s.ym === "2026-07") continue; // partial month — skip
    const tot = Number(s.v) + (recMap.get(s.ym) ?? 0);
    const bud = budMap.get(s.ym) ?? 0;
    if (bud > 0) {
      ratioSum += tot / bud;
      counted += 1;
      if (tot > bud) over += 1;
    }
  }
  console.log(
    `Budget fit: ${counted} full months, avg total/budget=${Math.round((ratioSum / counted) * 100)}%, ` +
      `months over budget=${over}/${counted}`,
  );

  const counts = {
    categories: await prisma.categories.count({ where: { userID: USER_ID } }),
    dashboards: await prisma.dashboards.count({ where: { userID: USER_ID } }),
    recurrings: await prisma.recurrings.count({ where: { userID: USER_ID } }),
    spendings: await prisma.spendings.count({ where: { userID: USER_ID } }),
    exceptionals: await prisma.exceptionals.count({ where: { userID: USER_ID } }),
  };
  console.log("Final counts:", counts);
}

// --------------------------------------------------------------------------
// Main
// --------------------------------------------------------------------------
async function main(): Promise<void> {
  const prisma = makePrisma();
  try {
    console.log(`Seeding coherent mock data for ${USER_EMAIL} (${USER_ID})`);
    console.log("Wiping placeholder rows (scoped to this user)...");
    await wipe(prisma);

    console.log("Generating dataset...");
    const { categoryRows, dashboardRows, recurringRows, spendingRows, exceptionalRows } = generate();
    console.log(
      `  generated: categories=${categoryRows.length} dashboards=${dashboardRows.length} ` +
        `recurrings=${recurringRows.length} spendings=${spendingRows.length} newExceptionals=${exceptionalRows.length}`,
    );

    console.log("Inserting...");
    await prisma.categories.createMany({ data: categoryRows as never });
    await prisma.dashboards.createMany({ data: dashboardRows as never });
    await prisma.recurrings.createMany({ data: recurringRows as never });
    await prisma.exceptionals.createMany({ data: exceptionalRows as never });
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
