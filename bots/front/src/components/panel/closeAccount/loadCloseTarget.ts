import "server-only";

import { pageData } from "@lib/api/server";

import type { CloseTargetData, CloseTargetRequest } from "@components/panel/closeAccount/interfaces/closeLoadTypes";
import type { BotDetailView, IncidentsView } from "@contracts/interfaces/panelTypes";

/** The bot to close and, when the modal answers one, the incident. */
export async function loadCloseTarget({ app, bot, incident }: CloseTargetRequest): Promise<CloseTargetData> {
  const base = `/apps/${encodeURIComponent(app)}`;
  const [detail, incidents] = await Promise.all([
    pageData<BotDetailView>(`${base}/bots/${encodeURIComponent(bot)}`),
    incident ? pageData<IncidentsView>(`${base}/incidents`) : Promise.resolve(null),
  ]);
  const found = incidents ? [...incidents.open, ...incidents.history].find((row) => row.id === incident) : undefined;
  return { bot: detail, incident: found ?? null };
}
