import { readDashboard } from "@apps/pfa/api/pfaApi";
import { isoDay } from "@apps/pfa/persona/guardrails";

import type { PfaPersona } from "@apps/pfa/interfaces/pfaTypes";
import type { BotAction } from "@core/interfaces/actionTypes";

const browseDashboard: BotAction<PfaPersona> = {
  name: "dashboard.view",
  description: "Opens the dashboard of the current month (read traffic)",
  weight: 25,
  run: async (ctx) => {
    const today = ctx.now();
    const from = new Date(today.getFullYear(), today.getMonth(), 1);
    const to = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    await readDashboard(ctx.client, { from: isoDay(from), to: isoDay(to) });
  },
};

export default browseDashboard;
