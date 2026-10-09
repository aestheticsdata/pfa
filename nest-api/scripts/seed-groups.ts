/**
 * Groups and shared receipts for the mock account (PFA-194).
 *
 * A decoration pass over spendings that already exist — freshly generated or
 * already in the database. It never adds money: on some days it regroups a few
 * of the day's spendings under one store and one receipt (a group, PFA-189),
 * on some others it gives two plain spendings the same receipt. Monthly totals
 * stay exactly what the seeder produced.
 *
 * Pure: randomness and category names come in through the context, the caller
 * writes the result (rows, then receipt images).
 */

import { randomBytes, randomUUID } from "node:crypto";

/** A spending as the pass reads it. */
export interface SeedSpending {
  ID: string;
  date: Date;
  label: string;
  amount: number;
  categoryID: string | null;
}

/** What changes on a spending: grouped, or holding a shared receipt. */
export interface SpendingDecoration {
  ID: string;
  groupID?: string;
  detail?: string;
  label?: string;
  invoicefile?: string;
}

export interface SeedGroup {
  ID: string;
  date: Date;
  label: string;
}

/** One receipt picture to render: who sold, when, what. */
export interface ReceiptSheet {
  invoicefile: string;
  store: string;
  date: Date;
  lines: { text: string; amount: number }[];
}

export interface Decoration {
  groups: SeedGroup[];
  updates: SpendingDecoration[];
  receipts: ReceiptSheet[];
}

export interface DecorateContext {
  random: () => number;
  /** The category name behind a spending's categoryID. */
  categoryName: (categoryID: string | null) => string | undefined;
}

/** A store visit that can cover several categories, with plausible line details per category. */
interface StoreRun {
  store: string;
  details: Record<string, string[]>;
}

const STORE_RUNS: StoreRun[] = [
  {
    store: "City Supermarket",
    details: {
      Groceries: ["Groceries", "Fresh produce", "Pantry", "Breakfast"],
      Home: ["Cleaning supplies", "Kitchen roll", "Bin bags"],
      Beauty: ["Toiletries", "Shampoo", "Toothpaste"],
      Health: ["Painkillers", "Plasters"],
      "Coffee & Drinks": ["Drinks", "Coffee beans"],
    },
  },
  {
    store: "Department Store",
    details: {
      Shopping: ["Clothes", "Shoes", "Accessories"],
      Home: ["Kitchenware", "Bedding", "Candles"],
      Gifts: ["Gift", "Gift wrap"],
      Beauty: ["Perfume", "Make-up"],
    },
  },
  {
    store: "Pharmacy",
    details: {
      Health: ["Medicine", "Vitamins", "First aid"],
      Beauty: ["Skincare", "Sunscreen"],
    },
  },
  {
    store: "Sports Store",
    details: {
      Sport: ["Running gear", "Yoga mat", "Water bottle"],
      Shopping: ["Sportswear", "Trainers"],
      Travel: ["Backpack"],
    },
  },
  {
    store: "Amazon",
    details: {
      Home: ["Home bits", "Light bulbs"],
      Gifts: ["Birthday gift"],
      Subscriptions: ["Kindle book"],
      Shopping: ["Phone case", "Cables"],
      Leisure: ["Board game"],
    },
  },
];

/** How often a day tries to form a group, and how often (otherwise) two rows share a receipt. */
const GROUP_CHANCE = 0.35;
const SHARED_CHANCE = 0.1;
/** Share of groups that come with their receipt. */
const GROUP_RECEIPT_CHANCE = 0.85;
const MAX_GROUP_LINES = 4;

/** File name of a seeded receipt — the prefix lets --wipe find exactly these. */
export const SEED_RECEIPT_PREFIX = "seed-receipt-";
const receiptName = () => `${SEED_RECEIPT_PREFIX}${randomBytes(4).toString("hex")}-r.jpg`;

/** Same as the app's composeGroupLineLabel: "<group> — <detail>". */
const groupLineLabel = (store: string, detail: string) => `${store} — ${detail}`;

const dayKey = (d: Date) => d.toISOString().slice(0, 10);

export function decorate(spendings: SeedSpending[], ctx: DecorateContext): Decoration {
  const pickFrom = <T>(items: T[]): T => items[Math.floor(ctx.random() * items.length)];
  const shuffled = <T>(items: T[]): T[] =>
    items
      .map((item) => ({ item, key: ctx.random() }))
      .sort((a, b) => a.key - b.key)
      .map(({ item }) => item);

  const byDay = new Map<string, SeedSpending[]>();
  for (const s of spendings) {
    byDay.set(dayKey(s.date), [...(byDay.get(dayKey(s.date)) ?? []), s]);
  }

  const result: Decoration = { groups: [], updates: [], receipts: [] };

  for (const day of [...byDay.keys()].sort()) {
    const plain = [...(byDay.get(day) ?? [])];

    if (ctx.random() < GROUP_CHANCE) {
      for (const run of shuffled(STORE_RUNS)) {
        // One spending per category the store covers — a group spans categories.
        const members = new Map<string, SeedSpending>();
        for (const s of plain) {
          const name = ctx.categoryName(s.categoryID);
          if (name && run.details[name] && !members.has(name)) members.set(name, s);
        }
        if (members.size < 2) continue;

        const lines = [...members.entries()].slice(0, MAX_GROUP_LINES);
        const groupID = randomUUID();
        const invoicefile = ctx.random() < GROUP_RECEIPT_CHANCE ? receiptName() : undefined;
        const date = lines[0][1].date;
        result.groups.push({ ID: groupID, date, label: run.store });
        const sheetLines: ReceiptSheet["lines"] = [];
        for (const [name, s] of lines) {
          const detail = pickFrom(run.details[name]);
          result.updates.push({ ID: s.ID, groupID, detail, label: groupLineLabel(run.store, detail), invoicefile });
          sheetLines.push({ text: detail, amount: s.amount });
          plain.splice(plain.indexOf(s), 1);
        }
        if (invoicefile) result.receipts.push({ invoicefile, store: run.store, date, lines: sheetLines });
        break;
      }
      continue;
    }

    if (plain.length >= 2 && ctx.random() < SHARED_CHANCE) {
      const [a, b] = shuffled(plain);
      const invoicefile = receiptName();
      result.updates.push({ ID: a.ID, invoicefile }, { ID: b.ID, invoicefile });
      result.receipts.push({
        invoicefile,
        store: a.label,
        date: a.date,
        lines: [
          { text: a.label, amount: a.amount },
          { text: b.label, amount: b.amount },
        ],
      });
    }
  }

  return result;
}
