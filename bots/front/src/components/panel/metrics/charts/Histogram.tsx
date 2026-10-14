import BucketTooltip from "@components/panel/metrics/tooltips/BucketTooltip";
import { Tooltip, TooltipContent, TooltipTrigger } from "@components/ui/Tooltip";
import { cx } from "@lib/classNames/cx";

import type { HistogramProps } from "@components/panel/metrics/interfaces/metricsTypes";

/**
 * Live bots by activity, count above each bar. Each bar has its tooltip (shadcn's, anchored: it
 * opens on keyboard focus too); a bar with bots opens their list (PFA-229).
 */
const Histogram = ({ buckets, day, liveBots, onSelect }: HistogramProps) => {
  const max = Math.max(1, ...buckets.map((bucket) => bucket.count));
  return (
    <>
      <div className="flex h-27.5 items-end gap-1.5 border-b border-line">
        {buckets.map((bucket) => {
          const bar = (
            <>
              <span>{bucket.count}</span>
              <i
                className="block min-h-0.5 w-full rounded-t-tag bg-ok/50 transition-opacity"
                style={{ height: `${(bucket.count / max) * 85}%` }}
              />
            </>
          );
          const column = "flex h-full flex-1 flex-col items-center justify-end gap-1 font-mono text-tiny text-muted";
          return (
            <Tooltip key={bucket.label}>
              <TooltipTrigger asChild>
                {bucket.count > 0 ? (
                  <button
                    type="button"
                    onClick={() => onSelect(bucket.label)}
                    className={cx(
                      column,
                      "cursor-pointer rounded-t-tag hover:bg-hover hover:text-text focus-visible:bg-hover focus-visible:outline-none",
                    )}
                  >
                    {bar}
                  </button>
                ) : (
                  <div className={column}>{bar}</div>
                )}
              </TooltipTrigger>
              <TooltipContent side="top">
                <BucketTooltip
                  bucket={bucket}
                  day={day}
                  liveBots={liveBots}
                />
              </TooltipContent>
            </Tooltip>
          );
        })}
      </div>
      <div className="mt-1.5 flex gap-1.5">
        {buckets.map((bucket) => (
          <span
            key={bucket.label}
            className="flex-1 text-center font-mono text-micro text-dim"
          >
            {bucket.label}
          </span>
        ))}
      </div>
    </>
  );
};

export default Histogram;
