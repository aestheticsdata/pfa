import { CATEGORIES } from "@apps/pfa/persona/categories";
import { BOT_KIND } from "@core/constants/bot";
import { Rng } from "@core/random/rng";

import type { CatalogItem, ItemHabit, PfaPersona } from "@apps/pfa/interfaces/pfaTypes";
import type { BotProfile } from "@core/interfaces/botTypes";

export const PFA_SYNTHETIC_DOMAIN = "synthetic.test";

/** Spread around 2 a week: some bots barely ever keep a receipt, others do it often. */
const RECEIPT_PACES = [0.5, 1, 1.5, 2, 2.5, 3, 3.5];

const { groceries, restaurants, bars, transport, home, health, bills, leisure } = CATEGORIES;

const item = (label: string, category: CatalogItem["category"], habit: ItemHabit): CatalogItem => ({
  label,
  category,
  min: habit.range[0],
  max: habit.range[1],
  weight: habit.weight,
  monthly: habit.monthly ?? false,
});

/** The four permanent "daily" bots (PFA-120), each with its own way of spending. */
const DAILY_PERSONAS: Record<string, Omit<PfaPersona, "receiptsPerWeek">> = {
  saturnus: {
    description: "Careful saver: bills, groceries, the odd household item",
    catalog: [
      item("Electricity", bills, { range: [35, 90], weight: 1, monthly: true }),
      item("Phone plan", bills, { range: [10, 25], weight: 1, monthly: true }),
      item("Internet", bills, { range: [25, 40], weight: 1, monthly: true }),
      item("Supermarket", groceries, { range: [20, 90], weight: 6 }),
      item("Hardware store", home, { range: [8, 60], weight: 2 }),
    ],
  },
  ceres: {
    description: "Cooks at home: groceries most days",
    catalog: [
      item("Supermarket", groceries, { range: [15, 110], weight: 5 }),
      item("Bakery", groceries, { range: [2, 9], weight: 6 }),
      item("Market", groceries, { range: [8, 35], weight: 3 }),
      item("Butcher", groceries, { range: [10, 40], weight: 2 }),
      item("Pharmacy", health, { range: [5, 30], weight: 1 }),
    ],
  },
  janus: {
    description: "Commuter: transport, lunches, everyday errands",
    catalog: [
      item("Metro ticket", transport, { range: [2, 20], weight: 5 }),
      item("Fuel", transport, { range: [30, 80], weight: 1 }),
      item("Lunch", restaurants, { range: [9, 18], weight: 5 }),
      item("Coffee", restaurants, { range: [2, 5], weight: 6 }),
      item("Dry cleaning", home, { range: [8, 25], weight: 1 }),
    ],
  },
  bacchus: {
    description: "Goes out: bars, restaurants, cinema",
    catalog: [
      item("Bar", bars, { range: [6, 45], weight: 6 }),
      item("Restaurant", restaurants, { range: [18, 90], weight: 4 }),
      item("Cinema", leisure, { range: [9, 25], weight: 2 }),
      item("Concert", leisure, { range: [25, 70], weight: 1 }),
      item("Taxi", transport, { range: [12, 35], weight: 3 }),
    ],
  },
};

export const PFA_DAILY_BOTS: BotProfile<PfaPersona>[] = Object.entries(DAILY_PERSONAS).map(([id, persona]) => ({
  id,
  email: `${id}@${PFA_SYNTHETIC_DOMAIN}`,
  kind: BOT_KIND.daily,
  persona: { ...persona, receiptsPerWeek: new Rng(`receipts:${id}`).pick(RECEIPT_PACES) },
}));
