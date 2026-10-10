import BotListRow from "@components/panel/bots/BotListRow";
import SelectAll from "@components/panel/bots/SelectAll";
import { BOTS_TEXT } from "@text/bots";

import type { BotsTableProps } from "@components/panel/bots/interfaces/botsTypes";

/** Below 700px the table becomes a list; "Select all · N" replaces the header checkbox. */
const BotsList = ({ app, rows, focused, ids }: BotsTableProps) => (
  <div className="tablet:hidden">
    <div className="flex min-h-11 items-center gap-0.5 border-t border-line-soft pr-3.5 pl-1.25 text-note text-dim">
      <span className="grid size-10 place-items-center">
        <SelectAll ids={ids} />
      </span>
      {BOTS_TEXT.selectAllCount(ids.length)}
    </div>
    {rows.map((bot) => (
      <BotListRow
        key={bot.id}
        app={app}
        bot={bot}
        focused={bot.id === focused}
      />
    ))}
  </div>
);

export default BotsList;
