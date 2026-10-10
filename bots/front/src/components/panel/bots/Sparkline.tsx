import { isLive } from "@components/panel/bots/botState";
import { cx } from "@lib/classNames/cx";

import type { SparklineProps } from "@components/panel/bots/interfaces/botsTypes";

/** A bot's last 30 s, 15 bars: red when errors are a fifth of the slice or more, flat grey when not live. */
const Sparkline = ({ bot }: SparklineProps) => {
  const live = isLive(bot.state);
  const max = Math.max(0.3, ...bot.spark.map((slice) => slice.actions + slice.errors));
  return (
    <div
      className="flex h-5 w-23 items-end gap-0.5"
      aria-hidden="true"
    >
      {bot.spark.map((slice, index) => {
        const total = slice.actions + slice.errors;
        const failing = total > 0 && slice.errors > total * 0.2;
        return (
          <span
            // biome-ignore lint/suspicious/noArrayIndexKey: 15 positional time slices
            key={index}
            className={cx("min-h-px flex-1 rounded-hair", !live ? "bg-line" : failing ? "bg-bad" : "bg-ok/55")}
            style={{ height: `${Math.max(5, (total / max) * 100)}%` }}
          />
        );
      })}
    </div>
  );
};

export default Sparkline;
