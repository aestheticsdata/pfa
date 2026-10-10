import { appPath } from "@lib/panel/routes";
import { PANEL_VIEW } from "@lib/panel/views";

import type { BotsFilters } from "@components/panel/bots/interfaces/botsTypes";

/** The Bots page's URL for a set of filters; defaults are left out. */
export function botsHref(app: string, filters: BotsFilters): string {
  const query = new URLSearchParams();
  if (filters.population !== "all") query.set("population", filters.population);
  if (filters.state !== "all") query.set("state", filters.state);
  if (filters.q) query.set("q", filters.q);
  if (filters.page > 0) query.set("page", String(filters.page));
  const search = query.toString();
  return `${appPath(app, PANEL_VIEW.bots)}${search ? `?${search}` : ""}`;
}

/** Reads the filters back from the page's search params. */
export function readFilters(params: Record<string, string | string[] | undefined>): BotsFilters {
  const one = (key: string) => (typeof params[key] === "string" ? params[key] : "");
  return {
    population: one("population") || "all",
    state: one("state") || "all",
    q: one("q"),
    page: Math.max(0, Number.parseInt(one("page") || "0", 10) || 0),
  };
}
