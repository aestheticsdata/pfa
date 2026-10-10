import type { CloseTarget, PanelView } from "@lib/panel/interfaces/panelRouteTypes";

export const appPath = (app: string, view: PanelView): string => `/${encodeURIComponent(app)}/${view}`;

/** The bot drawer: intercepted (a drawer over the page) from inside the app, a page of its own on a hard load. */
export const botPath = (app: string, bot: string): string =>
  `/${encodeURIComponent(app)}/bots/${encodeURIComponent(bot)}`;

/** The "Disable / purge account" modal, same interception. */
export const closePath = ({ app, bot, incident }: CloseTarget): string =>
  `/${encodeURIComponent(app)}/close/${encodeURIComponent(bot)}${incident ? `?incident=${encodeURIComponent(incident)}` : ""}`;
