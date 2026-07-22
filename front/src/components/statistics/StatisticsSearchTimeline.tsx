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
import useDateLocale from "@i18n/useDateLocale";
import useFormat from "@i18n/useFormat";
import useTranslations from "@i18n/useTranslations";
import { BarChart, LineChart, useElementWidth } from "@lib/dataviz";
import { cn } from "@lib/utils";
import format from "date-fns/format";
import parseISO from "date-fns/parseISO";
import { Search, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useQueryStates } from "nuqs";

import type { SpendingItem } from "@components/spendings/types";

const AMOUNT_BAND_H = 128;
const FREQ_BAND_H = 76;
const LATEST_MATCHES = 3;
const DAY_MS = 24 * 60 * 60 * 1000;

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

  // "≈ 1 fois tous les N jours · X € en moyenne · dernière le …" — the window
  // span over the match count, like the hero numbers a range-scoped figure.
  const spanDays = Math.max(1, Math.round((parseISO(to).getTime() - parseISO(from).getTime()) / DAY_MS));
  const frequencyLine = hasMatches
    ? [
        summary.count === 1 ? t.frequencyOnce : t.frequencyEvery(Math.round(spanDays / summary.count)),
        t.averageBasket(euro0(summary.total / summary.count)),
        summary.lastDate ? t.lastOn(format(parseISO(summary.lastDate), "d MMM yyyy", { locale: dateLocale })) : null,
      ]
        .filter(Boolean)
        .join(" · ")
    : null;

  // Fine bars: width-proportional slot, clamped so a year of daily buckets stays
  // legible and a month's bars don't balloon.
  const slot = points.length > 0 ? width / points.length : 0;
  const barWidth = Math.max(1.3, Math.min(6, slot * 0.66));

  // Same jump as the search modal: Spendings page on the week of the spending.
  const goToSpendingWeek = (spending: SpendingItem) => {
    const dateISO = format(parseISO(spending.date), DATE_FORMAT);
    setScrollToDayIso(dateISO);
    router.push(buildSpendingsPath(dateISO));
  };

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

      <p className="num mt-3.5 text-xs text-ink-3">{statusMessage ?? frequencyLine}</p>

      <div
        ref={chartRef}
        className="mt-5 w-full"
      >
        {width > 0 && (
          <>
            {/* Left→right draw of both bands, like the Dashboard daily curve.
                The remount key replays it when a new search resolves ("e"→"d"
                once data lands) and on every range hop. */}
            <div
              key={`${debounced}-${range}-${hasMatches ? "d" : "e"}`}
              className="pfa-anim-draw-x"
            >
              {/* Amount band — € gridlines at the rounded max and its half. */}
              <div className="relative border-b border-line">
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
                  ariaLabel={t.chartAria(debounced)}
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
    </GlowCard>
  );
};

export default StatisticsSearchTimeline;
