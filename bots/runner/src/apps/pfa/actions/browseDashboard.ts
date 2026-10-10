import { readDashboard } from "@apps/pfa/api/pfaApi";
import { PFA_TIME_ZONE } from "@apps/pfa/persona/bots";
import { zonedDay } from "@core/time/zonedTime";

import type { PfaPersona } from "@apps/pfa/interfaces/pfaTypes";
import type { BotAction } from "@core/interfaces/actionTypes";

const browseDashboard: BotAction<PfaPersona> = {
  name: "dashboard.view",
  description: "Opens the dashboard of the current month (read traffic)",
  weight: 25,
  run: async (ctx) => {
    // The month on the bot's clock: on the 1st before 02:00 in Paris, ks-b's UTC is still last month.
    const [year, month] = zonedDay(ctx.now(), PFA_TIME_ZONE).split("-").map(Number) as [number, number];
    const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
    const prefix = `${year}-${String(month).padStart(2, "0")}`;
    await readDashboard(ctx.client, { from: `${prefix}-01`, to: `${prefix}-${lastDay}` });
  },
};

export default browseDashboard;
