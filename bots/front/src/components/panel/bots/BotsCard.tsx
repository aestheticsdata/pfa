import BotsList from "@components/panel/bots/BotsList";
import BotsTable from "@components/panel/bots/BotsTable";
import BulkBar from "@components/panel/bots/BulkBar";
import Pager from "@components/panel/bots/Pager";
import Toolbar from "@components/panel/bots/Toolbar";
import Card from "@components/ui/Card";
import CardHeader from "@components/ui/CardHeader";
import { LOAD_PACE } from "@contracts/panel";
import { BOTS_TEXT } from "@text/bots";

import type { BotsCardProps } from "@components/panel/bots/interfaces/botsTypes";

/** Both populations in one table: filters, bulk on/off, 20 a page, a row opens the drawer. */
const BotsCard = ({ app, data, filters, focused = null }: BotsCardProps) => (
  <Card
    className="mt-4"
    testId="bots-card"
  >
    <CardHeader
      title={BOTS_TEXT.title}
      sub={BOTS_TEXT.sub(data.counts.population.daily ?? 0, data.counts.population.load ?? 0)}
    />
    <Toolbar
      app={app}
      data={data}
      filters={filters}
    />
    <BulkBar app={app} />
    <BotsTable
      app={app}
      rows={data.rows}
      focused={focused}
      ids={data.matchingIds}
      day={data.loadPace === LOAD_PACE.daily}
    />
    <BotsList
      app={app}
      rows={data.rows}
      focused={focused}
      ids={data.matchingIds}
    />
    {data.rows.length === 0 && <p className="m-0 px-3.5 py-5.5 text-center text-body text-dim">{BOTS_TEXT.none}</p>}
    <Pager
      app={app}
      data={data}
      filters={filters}
    />
  </Card>
);

export default BotsCard;
