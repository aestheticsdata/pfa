import { LegendItem } from "@components/shared/LegendItem";
import { AMOUNT_BAND_H, FREQ_BAND_H } from "@components/statistics/searchTimeline/constants";
import { barLayout, bucketAt } from "@components/statistics/searchTimeline/helpers/searchTimelineLayout";
import useFormat from "@i18n/useFormat";
import useTranslations from "@i18n/useTranslations";
import { BarChart, LineChart } from "@lib/dataviz";
import { cn } from "@lib/utils";

import type {
  SearchTimelineBucketSize,
  TimelinePoint,
  TimelineTick,
} from "@components/statistics/interfaces/searchTimelineTypes";
import type { useCursorHover } from "@lib/dataviz";
import type { Ref } from "react";

interface SearchTimelineChartProps {
  chartRef: Ref<HTMLDivElement>;
  width: number;
  points: TimelinePoint[];
  rolling: number[];
  maxRolling: number;
  yMax: number;
  ticks: TimelineTick[];
  windowDays: number;
  bucket: SearchTimelineBucketSize;
  hasMatches: boolean;
  /** The searched term, for the chart's label and the draw-in replay key. */
  term: string;
  /** Replays the draw-in on a range hop. */
  rangeKey: string;
  cursor: ReturnType<typeof useCursorHover<number>>;
  /** The hovered bucket's centre in %, or null. */
  crosshairLeft: number | null;
  bucketIsClickable: boolean;
  onBucketClick: (index: number) => void;
}

/**
 * Two bands over one shared time axis (amount in € and occurrence frequency don't
 * share a scale, so no dual axis): fine per-bucket amount bars on top, a
 * rolling-window occurrence curve below, then the date ticks and the legend.
 */
const SearchTimelineChart = ({
  chartRef,
  width,
  points,
  rolling,
  maxRolling,
  yMax,
  ticks,
  windowDays,
  bucket,
  hasMatches,
  term,
  rangeKey,
  cursor,
  crosshairLeft,
  bucketIsClickable,
  onBucketClick,
}: SearchTimelineChartProps) => {
  const { euro0 } = useFormat();
  const { searchTimeline: t } = useTranslations("statistics");
  const { slot, barWidth } = barLayout(width, points.length);

  return (
    <div
      ref={chartRef}
      className="mt-5 w-full"
    >
      {width > 0 && (
        <>
          {/* Hover host spanning both bands. The crosshair and its capture
              layer are SIBLINGS of the animated block, never children: the
              draw-in animation clips its own subtree and would clip them. */}
          {/* One hover handler on the host resolves the bucket by position
              (like the heatmap grid), so the crosshair tracks the cursor
              across both bands without a hit-testing layer per element. */}
          <div
            className="relative"
            role="img"
            aria-label={t.chartAria(term)}
            onMouseMove={
              hasMatches
                ? (e) =>
                    cursor.show(
                      e.clientX,
                      e.clientY,
                      bucketAt(e.clientX, e.currentTarget.getBoundingClientRect(), points.length),
                    )
                : undefined
            }
            onMouseLeave={cursor.clear}
          >
            {/* Left→right draw of both bands, like the Dashboard daily curve.
                The remount key replays it when a new search resolves ("e"→"d"
                once data lands) and on every range hop. */}
            <div
              key={`${term}-${rangeKey}-${hasMatches ? "d" : "e"}`}
              className="pfa-anim-draw-x"
            >
              {/* Amount band — € gridlines at the rounded max and its half.
                  Also the click surface: mouse-only, and duplicated by the
                  keyboard-reachable "latest matches" rows below. */}
              {/* biome-ignore lint/a11y/useKeyWithClickEvents: pointing at a bucket has no keyboard equivalent; the same navigation is exposed as real buttons in the matches list */}
              <div
                data-testid="search-timeline-amount"
                className={cn("relative border-b border-line", bucketIsClickable && "cursor-pointer")}
                role="img"
                aria-label={t.legendAmount}
                onClick={
                  hasMatches
                    ? (e) => onBucketClick(bucketAt(e.clientX, e.currentTarget.getBoundingClientRect(), points.length))
                    : undefined
                }
              >
                <div className="pointer-events-none absolute inset-x-0 top-0 border-t border-line-soft" />
                <div className="pointer-events-none absolute inset-x-0 top-1/2 border-t border-line-soft" />
                <BarChart
                  id="stat-search-bars"
                  bars={points.map((p) => ({ label: p.date, value: p.total }))}
                  width={width}
                  height={AMOUNT_BAND_H}
                  max={yMax}
                  gap={slot > 0 ? 1 - barWidth / slot : 0.35}
                  radius={Math.min(1.5, barWidth / 2)}
                  minBarSize={1.5}
                  gradient={["var(--accent-d)", "var(--accent-strong)"]}
                  ariaLabel={t.legendAmount}
                />
                {hasMatches && (
                  <>
                    <span className="num pointer-events-none absolute right-0 top-0 -translate-y-1/2 text-3xs text-ink-4">
                      {euro0(yMax)} €
                    </span>
                    <span className="num pointer-events-none absolute right-0 top-1/2 -translate-y-1/2 text-3xs text-ink-4">
                      {euro0(yMax / 2)} €
                    </span>
                  </>
                )}
              </div>

              {/* Frequency band — rolling occurrence count, same green and
                area gradient as the Dashboard "budget restant" chart. */}
              <div className="num mt-4 flex items-baseline justify-between text-3xs text-ink-4">
                <span>{t.windowLabel(windowDays)}</span>
                {hasMatches && <span>{t.windowMax(maxRolling)}</span>}
              </div>
              <div className="mt-1 border-b border-line">
                <LineChart
                  id="stat-search-freq"
                  width={width}
                  height={FREQ_BAND_H}
                  padding={{ top: 4, right: slot / 2, bottom: 1, left: slot / 2 }}
                  xDomain={[0, points.length - 1]}
                  yDomain={[0, maxRolling]}
                  series={
                    hasMatches ? [{ points: rolling, color: "var(--accent-strong)", area: true, smooth: true }] : []
                  }
                  ariaLabel={t.legendFrequency}
                />
              </div>
            </div>

            {crosshairLeft !== null && (
              <div
                className="pointer-events-none absolute inset-y-0 border-l border-dashed border-ink-3"
                style={{ left: `${crosshairLeft}%` }}
              />
            )}
          </div>

          <div className="relative mt-1.5 h-4">
            {ticks.map((tick) => (
              <span
                key={tick.index}
                className="num absolute -translate-x-1/2 text-3xs text-ink-4"
                style={{ left: `${((tick.index + 0.5) / points.length) * 100}%` }}
              >
                {tick.label}
              </span>
            ))}
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-4.5 text-xs text-ink-3">
            <LegendItem
              swatch={
                <i
                  className="inline-block size-2.5 rounded-xs"
                  style={{ background: "var(--bar-fill)" }}
                />
              }
            >
              {t.legendAmount}
            </LegendItem>
            <LegendItem swatch={<i className="inline-block h-0.5 w-3.5 bg-accent-strong" />}>
              {t.legendFrequency}
            </LegendItem>
            <span className="text-ink-4">{t.barUnit[bucket]}</span>
          </div>
        </>
      )}
    </div>
  );
};

export default SearchTimelineChart;
