import { isLive } from "@components/panel/bots/botState";
import { cx } from "@lib/classNames/cx";

import type { SparklineProps } from "@components/panel/bots/interfaces/botsTypes";

/**
 * A bot's last 30 s (15 bars) or, in daily pace, its last 24 h (24 bars, PFA-204): red when errors
 * are a fifth of the slice or more. The 30 s view goes flat grey when the bot is not live; the day
 * keeps its colours, since a daily bot sleeps between visits.
 */
const Sparkline = ({ bot, day }: SparklineProps) => {
  const slices = day ? bot.daySpark : bot.spark;
  const muted = !day && !isLive(bot.state);
  const max = Math.max(day ? 1 : 0.3, ...slices.map((slice) => slice.actions + slice.errors));
  return (
    <div
      className="flex h-5 w-23 items-end gap-0.5"
      aria-hidden="true"
    >
      {slices.map((slice, index) => {
        const total = slice.actions + slice.errors;
        const failing = total > 0 && slice.errors > total * 0.2;
        return (
          <span
            // biome-ignore lint/suspicious/noArrayIndexKey: positional time slices
            key={index}
            className={cx("min-h-px flex-1 rounded-hair", muted ? "bg-line" : failing ? "bg-bad" : "bg-ok/55")}
            style={{ height: `${Math.max(5, (total / max) * 100)}%` }}
          />
        );
      })}
    </div>
  );
};

export default Sparkline;
