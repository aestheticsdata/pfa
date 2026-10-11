import KindTag from "@components/panel/bots/KindTag";
import SliceSection from "@components/panel/overview/slice/SliceSection";
import { BOT_KIND } from "@contracts/panel";
import { count } from "@lib/format/format";
import { botPath } from "@lib/panel/routes";
import { OVERVIEW_TEXT } from "@text/overview";
import Link from "next/link";

import type { SliceBotsProps } from "@components/panel/overview/interfaces/overviewTypes";

/** The busiest bots shown; the rest are counted. */
const MAX_BOTS = 12;

/** Who was active in the slice, busiest first: each opens its bot's drawer. */
const SliceBots = ({ app, point, dailyIds, onLeave }: SliceBotsProps) => {
  const text = OVERVIEW_TEXT.slice;
  const bots = Object.entries(point.byBot).sort(([, a], [, b]) => b - a);
  const busiest = Math.max(1, ...bots.map(([, runs]) => runs));
  return (
    <SliceSection
      title={text.activeBots}
      aside={text.botsCount(bots.length)}
    >
      {bots.length === 0 ? (
        <p className="m-0 text-xs text-dim">{text.noBots}</p>
      ) : (
        <ul className="m-0 grid list-none grid-cols-1 gap-x-4 gap-y-1 p-0 tablet:grid-cols-2">
          {bots.slice(0, MAX_BOTS).map(([id, runs]) => (
            <li key={id}>
              <Link
                href={botPath(app, id)}
                onClick={onLeave}
                className="flex items-center gap-2 rounded-ctl px-1.5 py-1 font-mono text-note hover:bg-hover"
              >
                <span className="min-w-0 flex-1 truncate">{id}</span>
                <KindTag kind={dailyIds.includes(id) ? BOT_KIND.daily : BOT_KIND.load} />
                <span className="relative h-1 w-10 overflow-hidden rounded-xs bg-bg">
                  <span
                    className="absolute inset-y-0 left-0 bg-ok/55"
                    style={{ width: `${(runs / busiest) * 100}%` }}
                  />
                </span>
                <span className="w-6 text-right text-muted">{count(runs)}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
      {bots.length > MAX_BOTS && <p className="m-0 mt-2 text-xs text-dim">{text.moreBots(bots.length - MAX_BOTS)}</p>}
    </SliceSection>
  );
};

export default SliceBots;
