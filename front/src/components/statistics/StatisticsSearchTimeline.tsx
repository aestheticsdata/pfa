"use client";

import useDatePickerWrapperStore from "@components/datePickerWrapper/store";
import { CardTitle } from "@components/shared/CardSectionHeader";
import GlowCard from "@components/shared/GlowCard";
import { LegendItem } from "@components/shared/LegendItem";
import { DATE_FORMAT, SEARCH_DEBOUNCE_MS } from "@components/spendings/config/constants";
import SpendingSearchResultRow from "@components/spendings/search/SpendingSearchResultRow";
import useDebouncedValue from "@components/spendings/search/useDebouncedValue";
import useSpendingSearch from "@components/spendings/services/useSpendingSearch";
import {
  fillTimeline,
  rollingCounts,
  rollingWindowBuckets,
  SEARCH_TIMELINE_RANGE_VALUES,
  SEARCH_TIMELINE_RANGES,
  timelineTicks,
} from "@components/statistics/helpers/searchTimelineData";
import { niceCeil } from "@components/statistics/helpers/statisticsData";
import { searchTimelineParsers, searchTimelineUrlOptions } from "@components/statistics/searchTimelineParams";
import useStatisticsSearchTimeline from "@components/statistics/services/useStatisticsSearchTimeline";
import { buildSpendingsPath } from "@helpers/dateRoute";
import { interpolate } from "@i18n/interpolate";
import useDateLocale from "@i18n/useDateLocale";
import useFormat from "@i18n/useFormat";
import useTranslations from "@i18n/useTranslations";
import { BarChart, CursorTooltip, LineChart, useCursorHover, useElementWidth } from "@lib/dataviz";
import { cn } from "@lib/utils";
import format from "date-fns/format";
import parseISO from "date-fns/parseISO";
import { Search, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useQueryStates } from "nuqs";
import { Fragment } from "react";

import type { SpendingItem } from "@components/spendings/interfaces/spendingListTypes";
import type { ReactNode } from "react";

const AMOUNT_BAND_H = 128;
const FREQ_BAND_H = 76;
const LATEST_MATCHES = 3;
const DAY_MS = 24 * 60 * 60 * 1000;

/** A figure inside a summary sentence — bright against the muted words framing it. */
const Figure = ({ children }: { children: ReactNode }) => <span className="font-medium text-ink">{children}</span>;

/**
 * Search-timeline widget (COS-160), the exploration block closing /statistics:
 * type a label substring and see when — and how often — that spending happens.
 * Two bands over one shared time axis (amount in € and occurrence frequency
 * don't share a scale, so no dual axis): fine per-bucket amount bars on top, a
 * rolling-window occurrence curve below. Deliberately autonomous — own search
 * field, own range presets carried in the URL (nuqs) — and blind to the page's
 * year/compare/category filters: a search term is orthogonal to them, and the
 * whole point of the widget is crossing year boundaries.
 *
 * The full frame — hero slots, range switcher (disabled), chart bands, time
 * axis — renders even before any search: the empty widget announces its shape
 * instead of collapsing to a bare hint. It also keeps the measured chart
 * wrapper permanently mounted, which useElementWidth requires (its
 * ResizeObserver attaches on mount and would never see a late-mounted node).
 */
const StatisticsSearchTimeline = () => {
  const statistics = useTranslations("statistics");
  const { euro0 } = useFormat();
  const dateLocale = useDateLocale();
  const router = useRouter();
  const { setScrollToDayIso } = useDatePickerWrapperStore();
  const [{ term, range }, setParams] = useQueryStates(searchTimelineParsers, searchTimelineUrlOptions);
  const debounced = useDebouncedValue(term, SEARCH_DEBOUNCE_MS);
  const { timeline, isSearching, error, hasQuery, from, to, bucket } = useStatisticsSearchTimeline(debounced, range);
  // Latest matching rows — same query (and cache) as the Dashboard search modal,
  // so the two features can never disagree on what matches.
  const { results } = useSpendingSearch(debounced, null);
  const [chartRef, width] = useElementWidth<HTMLDivElement>();
  // Hovered bucket index, shared by the crosshair line and the tooltip.
  const cursor = useCursorHover<number>();

  const t = statistics.searchTimeline;

  // `keepPreviousData` can leave a stale placeholder around after the term is
  // cleared — everything data-driven keys off hasQuery too.
  const summary = hasQuery && !error ? timeline?.summary : undefined;
  const hasMatches = !!summary && summary.count > 0;
  // The term's newest matches over the WHOLE history, deliberately not clipped
  // to the displayed range: they answer "when did I last buy this?", a question
  // the range switcher must not truncate.
  const latestMatches = hasQuery && !error ? results.slice(0, LATEST_MATCHES) : [];

  // One status line under the hero: hint → error → loading → no-occurrence →
  // (data) the frequency summary. Inline, so the frame never collapses and the
  // range switcher stays reachable (an empty 1 mois must not lock the user out
  // of the 3 ans view where the matches live).
  const resolveStatusMessage = (): string | null => {
    if (!hasQuery) return t.hint;
    if (error) return t.error;
    if (!summary) return isSearching ? t.loading : null;
    if (summary.count === 0) return t.noResults;
    return null;
  };
  const statusMessage = resolveStatusMessage();

  // Dense series over the window — the window only depends on the range, so the
  // frame (ticks, bands) renders with or without data; the API only ships
  // non-empty buckets and zero-filled bars simply draw nothing.
  const points = fillTimeline(hasMatches ? (timeline?.buckets ?? []) : [], from, to, bucket);
  const rolling = rollingCounts(points, rollingWindowBuckets(range));
  const maxRolling = Math.max(1, ...rolling);
  const yMax = niceCeil(Math.max(0, ...points.map((p) => p.total)));
  const ticks = timelineTicks(points, range, dateLocale);
  const { windowDays } = SEARCH_TIMELINE_RANGES[range];

  const peak = points.reduce((best, p) => (p.total > best.total ? p : best), points[0]);
  const peakLabel =
    hasMatches && peak.total > 0
      ? (bucket === "day" ? t.peakDay : t.peakWeek)(
          euro0(peak.total),
          format(parseISO(peak.date), "d MMM yy", { locale: dateLocale }),
        )
      : null;

  // Cadence · average basket · last occurrence — three distinct facts, so each
  // carries its figure highlighted rather than dissolving into one flat run of
  // muted text. Cadence is the window span over the match count, a range-scoped
  // figure like the hero numbers.
  const spanDays = Math.max(1, Math.round((parseISO(to).getTime() - parseISO(from).getTime()) / DAY_MS));
  const everyDays = hasMatches ? Math.round(spanDays / summary.count) : 0;
  const summaryFacts: { id: string; node: ReactNode }[] = hasMatches
    ? [
        {
          id: "cadence",
          node:
            summary.count === 1
              ? t.frequencyOnce
              : everyDays <= 1
                ? t.frequencyDaily
                : interpolate(t.frequencyEvery, { days: <Figure>{everyDays}</Figure> }),
        },
        {
          id: "basket",
          node: interpolate(t.averageBasket, { amount: <Figure>{euro0(summary.total / summary.count)} €</Figure> }),
        },
        ...(summary.lastDate
          ? [
              {
                id: "last",
                node: interpolate(t.lastOn, {
                  date: <Figure>{format(parseISO(summary.lastDate), "d MMM yyyy", { locale: dateLocale })}</Figure>,
                }),
              },
            ]
          : []),
      ]
    : [];

  // Fine bars: width-proportional slot, clamped so a year of daily buckets stays
  // legible and a month's bars don't balloon.
  const slot = points.length > 0 ? width / points.length : 0;
  const barWidth = Math.max(1.3, Math.min(6, slot * 0.66));

  // Both bands share one time axis, so they share ONE crosshair: hovering
  // anywhere over the chart resolves the same bucket, and amount and frequency
  // read at the same instant. A hovered index can outlive a range switch, hence
  // the bounds-checked lookup.
  const hoveredIndex = cursor.hover?.data ?? null;
  const hoveredPoint = hoveredIndex !== null ? (points[hoveredIndex] ?? null) : null;
  const hoveredRolling = hoveredIndex !== null ? (rolling[hoveredIndex] ?? 0) : 0;
  // Bucket centre, the same anchor the bars and the date labels use.
  const crosshairLeft = hoveredIndex !== null && hoveredPoint ? ((hoveredIndex + 0.5) / points.length) * 100 : null;

  const hoverBucketAt = (clientX: number, rect: DOMRect): number =>
    Math.min(points.length - 1, Math.max(0, Math.floor(((clientX - rect.left) / rect.width) * points.length)));

  // Same jump as the search modal: Spendings page on the week of the spending.
  const goToSpendingWeek = (spending: SpendingItem) => {
    const dateISO = format(parseISO(spending.date), DATE_FORMAT);
    setScrollToDayIso(dateISO);
    router.push(buildSpendingsPath(dateISO));
  };

  // The amount band doubles as a jump target: clicking a bucket opens the
  // Spendings page on its week, the same destination as a result row. The
  // clickable unit is the bucket's whole column, not the 1.3px bar — the bar is
  // unaimable on the year view, and the crosshair already tells the user which
  // bucket is under the cursor. Only the frequency band is left inert: it reads
  // a rolling window, not one dated bucket. A bucket's start day already is a
  // DATE_FORMAT string (a week bucket's Sunday lands in the right week).
  const goToBucketWeek = (index: number) => {
    const point = points[index];
    if (!point || point.count === 0) return;
    setScrollToDayIso(point.date);
    router.push(buildSpendingsPath(point.date));
  };
  // Empty buckets have nothing to open, so they keep the default cursor.
  const bucketIsClickable = hoveredPoint !== null && hoveredPoint.count > 0;

  return (
    <GlowCard
      as="section"
      className="px-6 py-5.5"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-4">
        <div>
          <CardTitle>{t.title}</CardTitle>
          <p className="mt-0.5 text-xs text-ink-4">{t.subtitle}</p>
        </div>
        {peakLabel && <span className="num text-xs text-ink-2">{peakLabel}</span>}
      </div>

      <div className="mt-4.5 flex flex-wrap items-center justify-between gap-4">
        <div className="flex min-w-0 max-w-85 flex-1 items-center gap-2.5 rounded-xl border border-line bg-surface-base px-3.5 py-2">
          <Search className="size-4 shrink-0 text-ink-4" />
          <input
            type="search"
            value={term}
            onChange={(e) => setParams({ term: e.target.value })}
            placeholder={t.placeholder}
            // The custom clear button replaces WebKit's native one — two ✕ side
            // by side otherwise.
            className="min-w-0 flex-1 bg-transparent p-0 text-sm text-ink outline-none placeholder:text-ink-4 [&::-webkit-search-cancel-button]:appearance-none"
          />
          {term !== "" && (
            <button
              type="button"
              onClick={() => setParams({ term: null })}
              aria-label={t.clear}
              className="shrink-0 cursor-pointer text-ink-4 transition-colors hover:text-ink"
            >
              <X className="size-4" />
            </button>
          )}
        </div>
      </div>

      <div className="mt-4.5 flex flex-wrap items-end justify-between gap-4">
        <div className="flex items-baseline gap-6">
          <div>
            <div className="num text-3xl font-medium leading-none tracking-tight text-ink">
              {summary ? `${euro0(summary.total)} €` : "—"}
            </div>
            <div className="mt-2 text-2xs uppercase tracking-caps text-ink-3">{t.totalSpent}</div>
          </div>
          <div>
            <div className="num text-2xl font-medium leading-none tracking-tight text-accent-strong">
              {summary ? summary.count : "—"}
            </div>
            <div className="mt-2 text-2xs uppercase tracking-caps text-ink-3">{t.occurrences}</div>
          </div>
        </div>
        <div className="flex gap-1.5 rounded-xl border border-line bg-surface-base p-1">
          {SEARCH_TIMELINE_RANGE_VALUES.map((value) => (
            <button
              key={value}
              type="button"
              disabled={!hasQuery}
              onClick={() => setParams({ range: value })}
              className={cn(
                "rounded-lg border px-3.5 py-1.5 text-xs transition-colors",
                range === value ? "border-line bg-surface-hi" : "border-transparent",
                hasQuery
                  ? range === value
                    ? "cursor-pointer text-ink"
                    : "cursor-pointer text-ink-3 hover:text-ink"
                  : "text-ink-5",
              )}
            >
              {t.ranges[value]}
            </button>
          ))}
        </div>
      </div>

      {statusMessage !== null ? (
        <p className="num mt-3.5 text-xs text-ink-3">{statusMessage}</p>
      ) : (
        <p className="num mt-3.5 flex flex-wrap items-baseline gap-x-2.5 gap-y-1 text-xs text-ink-4">
          {summaryFacts.map((fact, i) => (
            <Fragment key={fact.id}>
              {i > 0 && <span className="text-ink-5">·</span>}
              <span>{fact.node}</span>
            </Fragment>
          ))}
        </p>
      )}

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
              aria-label={t.chartAria(debounced)}
              onMouseMove={
                hasMatches
                  ? (e) =>
                      cursor.show(
                        e.clientX,
                        e.clientY,
                        hoverBucketAt(e.clientX, e.currentTarget.getBoundingClientRect()),
                      )
                  : undefined
              }
              onMouseLeave={cursor.clear}
            >
              {/* Left→right draw of both bands, like the Dashboard daily curve.
                  The remount key replays it when a new search resolves ("e"→"d"
                  once data lands) and on every range hop. */}
              <div
                key={`${debounced}-${range}-${hasMatches ? "d" : "e"}`}
                className="pfa-anim-draw-x"
              >
                {/* Amount band — € gridlines at the rounded max and its half.
                    Also the click surface: mouse-only, and duplicated by the
                    keyboard-reachable "latest matches" rows below. */}
                {/* biome-ignore lint/a11y/useKeyWithClickEvents: pointing at a bucket has no keyboard equivalent; the same navigation is exposed as real buttons in the matches list */}
                <div
                  className={cn("relative border-b border-line", bucketIsClickable && "cursor-pointer")}
                  role="img"
                  aria-label={t.legendAmount}
                  onClick={
                    hasMatches
                      ? (e) => goToBucketWeek(hoverBucketAt(e.clientX, e.currentTarget.getBoundingClientRect()))
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

      {latestMatches.length > 0 && (
        <div className="mt-5">
          <h3 className="mb-2 text-2xs uppercase tracking-caps text-ink-3">{t.latestTitle}</h3>
          <div className="overflow-hidden rounded-xl border border-line-soft">
            {latestMatches.map((item) => (
              <SpendingSearchResultRow
                key={item.ID}
                spending={item}
                onSelect={goToSpendingWeek}
              />
            ))}
          </div>
        </div>
      )}

      <CursorTooltip point={cursor.hover}>
        {hoveredPoint && (
          <>
            <div className="font-medium capitalize">
              {bucket === "day"
                ? format(parseISO(hoveredPoint.date), "EEE d MMM yyyy", { locale: dateLocale })
                : t.tooltip.weekOf(format(parseISO(hoveredPoint.date), "d MMM yyyy", { locale: dateLocale }))}
            </div>
            <div className="mt-0.5">
              {hoveredPoint.count > 0
                ? `${euro0(hoveredPoint.total)} € · ${t.tooltip.spendings(hoveredPoint.count)}`
                : t.tooltip.noSpend}
            </div>
            <div className="text-ink-3">{t.tooltip.rolling(hoveredRolling, windowDays)}</div>
          </>
        )}
      </CursorTooltip>
    </GlowCard>
  );
};

export default StatisticsSearchTimeline;
