import { readStatistics } from "@apps/pfa/api/pfaApi";

import type { PfaPersona } from "@apps/pfa/interfaces/pfaTypes";
import type { BotAction } from "@core/interfaces/actionTypes";

const browseStatistics: BotAction<PfaPersona> = {
  name: "statistics.view",
  description: "Opens the statistics of the current year (read traffic)",
  weight: 10,
  run: async (ctx) => {
    await readStatistics(ctx.client, ctx.now().getFullYear());
  },
};

export default browseStatistics;
