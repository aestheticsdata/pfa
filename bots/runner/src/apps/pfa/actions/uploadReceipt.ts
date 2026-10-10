import { uploadReceipt } from "@apps/pfa/api/pfaApi";
import { lastSpending, rememberUpload, uploadsInLastWeek } from "@apps/pfa/persona/botMemory";
import { loadReceipts, RECEIPT_RULES } from "@apps/pfa/receipts/receiptImages";

import type { PfaPersona } from "@apps/pfa/interfaces/pfaTypes";
import type { BotAction } from "@core/interfaces/actionTypes";

/** Even a bot at the top of the pace range never uploads more than this in a week. */
const MAX_UPLOADS_PER_WEEK = 5;

const uploadReceiptAction: BotAction<PfaPersona> = {
  name: "receipt.upload",
  description: "Attaches one of the ten fixed receipt pictures to the bot's last spending (upload budget)",
  weight: 60,
  canRun: (ctx) => {
    const spending = lastSpending(ctx.memory);
    return (
      spending?.wantsReceipt === true &&
      !spending.hasReceipt &&
      uploadsInLastWeek(ctx.memory, ctx.now()) < MAX_UPLOADS_PER_WEEK &&
      ctx.uploads.canSpend(RECEIPT_RULES.maxBytes)
    );
  },
  run: async (ctx) => {
    const spending = lastSpending(ctx.memory);
    if (!spending) {
      return;
    }
    const image = ctx.rng.pick(await loadReceipts());
    // Charged at what PFA stores (see RECEIPT_RULES), written in the ledger before the bytes leave:
    // the yearly budget can't be crossed.
    if (!ctx.uploads.reserve(RECEIPT_RULES.maxBytes)) {
      return;
    }
    await uploadReceipt(ctx.client, { spending, image });
    spending.hasReceipt = true;
    rememberUpload(ctx.memory, ctx.now());
  },
};

export default uploadReceiptAction;
