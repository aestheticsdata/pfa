"use client";

import useCursorHover from "@components/hooks/useCursorHover";
import BucketTooltip from "@components/panel/metrics/tooltips/BucketTooltip";
import CursorTooltip from "@components/ui/CursorTooltip";
import { cx } from "@lib/classNames/cx";
import { CHART_TEXT } from "@text/charts";
import { METRICS_TEXT } from "@text/metrics";

import type { HistogramProps } from "@components/panel/metrics/interfaces/metricsTypes";
import type { MouseEvent } from "react";

/**
 * Live bots by activity, count above each bar. Each bar has its tooltip, following the cursor like
 * every other chart's (PFA-230); a bar with bots opens their list (PFA-229).
 */
const Histogram = ({ buckets, day, liveBots, onSelect }: HistogramProps) => {
  // The bucket by its label: the tooltip re-reads its figures at every refresh under a still pointer.
  const { hover, show, clear } = useCursorHover<string>();
  const hovered = hover && buckets.find((bucket) => bucket.label === hover.data);
  const max = Math.max(1, ...buckets.map((bucket) => bucket.count));
  return (
    <>
      <figure
        className="m-0 flex h-27.5 items-end gap-1.5 border-b border-line"
        aria-label={METRICS_TEXT.activity}
        onMouseLeave={clear}
      >
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
          const column = cx(
            "flex h-full flex-1 flex-col items-center justify-end gap-1 font-mono text-tiny text-muted",
            hover?.data === bucket.label && "bg-hover text-text",
          );
          const follow = (event: MouseEvent<HTMLElement>) => show(event.clientX, event.clientY, bucket.label);
          return bucket.count > 0 ? (
            <button
              key={bucket.label}
              type="button"
              aria-label={CHART_TEXT.bucket.title(bucket.label, day)}
              onClick={() => onSelect(bucket.label)}
              onMouseMove={follow}
              className={cx(
                column,
                "cursor-pointer rounded-t-tag hover:bg-hover hover:text-text focus-visible:bg-hover focus-visible:outline-none",
              )}
            >
              {bar}
            </button>
          ) : (
            // biome-ignore lint/a11y/noStaticElementInteractions: the pointer only feeds the tooltip; an empty bar does nothing
            <div
              key={bucket.label}
              className={column}
              onMouseMove={follow}
            >
              {bar}
            </div>
          );
        })}
      </figure>
      <CursorTooltip point={hover}>
        {hovered && (
          <BucketTooltip
            bucket={hovered}
            day={day}
            liveBots={liveBots}
          />
        )}
      </CursorTooltip>
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
