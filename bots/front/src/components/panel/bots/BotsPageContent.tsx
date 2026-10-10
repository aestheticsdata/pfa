import BotsCard from "@components/panel/bots/BotsCard";
import { readFilters } from "@components/panel/bots/botsQuery";
import { pageData } from "@lib/api/server";

import type { BotsPageContentProps } from "@components/panel/bots/interfaces/botsPageTypes";
import type { BotsPage } from "@contracts/interfaces/panelTypes";

/** Loads one page of bots for the filters in the URL. Shared by `/bots` and a hard load of `/bots/[bot]`. */
const BotsPageContent = async ({ app, searchParams, focused = null }: BotsPageContentProps) => {
  const filters = readFilters(searchParams);
  const query = new URLSearchParams({
    population: filters.population,
    state: filters.state,
    q: filters.q,
    page: String(filters.page),
  });
  const data = await pageData<BotsPage>(`/apps/${encodeURIComponent(app)}/bots?${query}`);
  return (
    <BotsCard
      app={app}
      data={data}
      filters={filters}
      focused={focused}
    />
  );
};

export default BotsPageContent;
