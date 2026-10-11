import { createSpending } from "@apps/pfa/api/pfaApi";
import { billPaid, rememberBill, rememberSpending } from "@apps/pfa/persona/botMemory";
import { PFA_TIME_ZONE } from "@apps/pfa/persona/bots";
import { clampAmount, plausibleDate } from "@apps/pfa/persona/guardrails";

import type { CatalogItem, PfaPersona } from "@apps/pfa/interfaces/pfaTypes";
import type { BotAction } from "@core/interfaces/actionTypes";

/**
 * About how many spendings a daily bot enters in a week: ≈ 2.5 visits a day, three quarters of them
 * outside the quiet hours, at most one spending each (and most visits have one) → 1–2 a day, like a
 * real user. Used to turn "N receipts a week" into a per-spending chance.
 */
const SPENDINGS_PER_WEEK = 11;

const addSpending: BotAction<PfaPersona> = {
  name: "spending.add",
  description: "Adds a spending from the bot's own catalog (bounded amount, plausible date, pooled category)",
  weight: 50,
  pausedInQuietHours: true,
  maxPerVisit: 1,
  run: async (ctx) => {
    const { persona } = ctx.bot;
    const date = plausibleDate(ctx.now(), ctx.rng, PFA_TIME_ZONE);
    // Bills come once a month; everything else as often as the bot's habits say.
    const choices = persona.catalog.filter((candidate) => !candidate.monthly || !billPaid(ctx.memory, candidate, date));
    const item = ctx.rng.weighted(choices, (candidate: CatalogItem) => candidate.weight);
    if (!item) {
      return;
    }
    const ID = await createSpending(ctx.client, {
      date,
      label: item.label,
      amount: clampAmount(ctx.rng.float(item.min, item.max)),
      category: { ID: null, name: item.category.name, color: item.category.color },
      currency: "EUR",
    });
    if (item.monthly) {
      rememberBill(ctx.memory, item, date);
    }
    rememberSpending(ctx.memory, {
      ID,
      date,
      label: item.label,
      wantsReceipt: ctx.rng.chance(persona.receiptsPerWeek / SPENDINGS_PER_WEEK),
      hasReceipt: false,
    });
  },
};

export default addSpending;
