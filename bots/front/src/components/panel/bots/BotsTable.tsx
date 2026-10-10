import BotTableRow from "@components/panel/bots/BotTableRow";
import SelectAll from "@components/panel/bots/SelectAll";
import { cx } from "@lib/classNames/cx";
import { BOTS_TEXT } from "@text/bots";

import type { BotsTableProps } from "@components/panel/bots/interfaces/botsTypes";

const HEAD =
  "whitespace-nowrap border-b border-line-soft px-2.5 py-2 text-left text-tiny font-medium uppercase tracking-th text-dim first:pl-3.5 last:pr-3.5";

/** The Bots table, from 700px: Activity from 1100, Total from 1280. */
const BotsTable = ({ app, rows, focused, ids }: BotsTableProps) => {
  const c = BOTS_TEXT.columns;
  return (
    <div className="hidden overflow-x-auto tablet:block">
      <table className="w-full border-collapse [&_tbody_tr:last-child_td]:border-b-0">
        <thead>
          <tr>
            <th className={cx(HEAD, "w-7.5")}>
              <SelectAll ids={ids} />
            </th>
            <th className={HEAD}>{c.bot}</th>
            <th className={HEAD}>{c.type}</th>
            <th className={HEAD}>{c.status}</th>
            <th className={HEAD}>{c.action}</th>
            <th className={cx(HEAD, "hidden desktop:table-cell")}>{c.activity}</th>
            <th className={cx(HEAD, "text-right")}>{c.apm}</th>
            <th className={cx(HEAD, "text-right")}>{c.errors}</th>
            <th className={cx(HEAD, "hidden text-right xl:table-cell")}>{c.total}</th>
            <th className={HEAD}>{c.lastSeen}</th>
            <th className={cx(HEAD, "w-15 text-right")}>{c.on}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((bot) => (
            <BotTableRow
              key={bot.id}
              app={app}
              bot={bot}
              focused={bot.id === focused}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default BotsTable;
