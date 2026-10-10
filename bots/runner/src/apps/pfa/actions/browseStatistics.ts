import { readStatistics } from "@apps/pfa/api/pfaApi";
import { PFA_TIME_ZONE } from "@apps/pfa/persona/bots";
import { zonedDay } from "@core/time/zonedTime";

import type { PfaPersona } from "@apps/pfa/interfaces/pfaTypes";
import type { BotAction } from "@core/interfaces/actionTypes";

const browseStatistics: BotAction<PfaPersona> = {
  name: "statistics.view",
  description: "Opens the statistics of the current year (read traffic)",
  weight: 10,
  run: async (ctx) => {
    await readStatistics(ctx.client, Number(zonedDay(ctx.now(), PFA_TIME_ZONE).slice(0, 4)));
  },
};

export default browseStatistics;
