import KindTag from "@components/panel/bots/KindTag";
import { BOT_KIND } from "@contracts/panel";
import { botPath } from "@lib/panel/routes";
import Link from "next/link";

import type { BotBarsProps } from "@components/panel/shared/interfaces/sharedTypes";

/** Bots and their figure, a bar each against the busiest: each opens its drawer (slice, bucket). */
const BotBars = ({ app, bots, dailyIds, onLeave }: BotBarsProps) => {
  const busiest = Math.max(1, ...bots.map((bot) => bot.value));
  return (
    <ul className="m-0 grid list-none grid-cols-1 gap-x-4 gap-y-1 p-0 tablet:grid-cols-2">
      {bots.map((bot) => (
        <li key={bot.id}>
          <Link
            href={botPath(app, bot.id)}
            onClick={onLeave}
            className="flex items-center gap-2 rounded-ctl px-1.5 py-1 font-mono text-note hover:bg-hover"
          >
            <span className="min-w-0 flex-1 truncate">{bot.id}</span>
            <KindTag kind={dailyIds.includes(bot.id) ? BOT_KIND.daily : BOT_KIND.load} />
            <span className="relative h-1 w-10 overflow-hidden rounded-xs bg-bg">
              <span
                className="absolute inset-y-0 left-0 bg-ok/55"
                style={{ width: `${(bot.value / busiest) * 100}%` }}
              />
            </span>
            <span className="min-w-6 text-right text-muted">{bot.label}</span>
          </Link>
        </li>
      ))}
    </ul>
  );
};

export default BotBars;
