"use client";

import useDatePickerWrapperStore from "@components/datePickerWrapper/store";
import { CardTitle } from "@components/shared/CardSectionHeader";
import GlowCard from "@components/shared/GlowCard";
import { DATE_FORMAT, SEARCH_DEBOUNCE_MS } from "@components/spendings/config/constants";
import useDebouncedValue from "@components/spendings/search/useDebouncedValue";
import useSpendingSearch from "@components/spendings/services/useSpendingSearch";
import {
  fillTimeline,
  rollingCounts,
  rollingWindowBuckets,
  SEARCH_TIMELINE_BUCKET,
  SEARCH_TIMELINE_RANGES,
  timelineTicks,
} from "@components/statistics/helpers/searchTimelineData";
import { niceCeil } from "@components/statistics/helpers/statisticsData";
import { LATEST_MATCHES } from "@components/statistics/searchTimeline/constants";
import SearchTimelineChart from "@components/statistics/searchTimeline/SearchTimelineChart";
import SearchTimelineHero from "@components/statistics/searchTimeline/SearchTimelineHero";
import SearchTimelineLatest from "@components/statistics/searchTimeline/SearchTimelineLatest";
import SearchTimelineSearchField from "@components/statistics/searchTimeline/SearchTimelineSearchField";
import SearchTimelineSummaryLine from "@components/statistics/searchTimeline/SearchTimelineSummaryLine";
import SearchTimelineTooltipContent from "@components/statistics/searchTimeline/SearchTimelineTooltipContent";
import { searchTimelineParsers, searchTimelineUrlOptions } from "@components/statistics/searchTimelineParams";
import useStatisticsSearchTimeline from "@components/statistics/services/useStatisticsSearchTimeline";
import { Tooltip } from "@components/ui/tooltip";
import { buildSpendingsPath } from "@helpers/dateRoute";
import useDateLocale from "@i18n/useDateLocale";
import useFormat from "@i18n/useFormat";
import useTranslations from "@i18n/useTranslations";
import { useCursorHover, useElementWidth } from "@lib/dataviz";
import { format, parseISO } from "date-fns";
import { useRouter } from "next/navigation";
import { useQueryStates } from "nuqs";

import type { SpendingItem } from "@components/spendings/interfaces/spendingListTypes";

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
  const { euro } = useFormat();
  const dateLocale = useDateLocale();
  const router = useRouter();
  const setScrollToDayIso = useDatePickerWrapperStore((state) => state.setScrollToDayIso);
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
  const latestMatches = hasQuery && !error ? results.slice(0, LATEST_MATCHES) : [];

  // One status line under the hero: hint → error → loading → no-occurrence →
  // (data) the frequency summary.
  const resolveStatusMessage = (): string | null => {
    if (!hasQuery) return t.hint;
    if (error) return t.error;
    if (!summary) return isSearching ? t.loading : null;
    if (summary.count === 0) return t.noResults;
    return null;
  };

  // Dense series over the window — the window only depends on the range, so the
  // frame (ticks, bands) renders with or without data; the API only ships
  // non-empty buckets and zero-filled bars simply draw nothing.
  const points = fillTimeline(hasMatches ? (timeline?.buckets ?? []) : [], { from, to }, bucket);
  const rolling = rollingCounts(points, rollingWindowBuckets(range));
  const { windowDays } = SEARCH_TIMELINE_RANGES[range];

  const peak = points.reduce((best, p) => (p.total > best.total ? p : best), points[0]);
  const peakLabel =
    hasMatches && peak.total > 0
      ? (bucket === SEARCH_TIMELINE_BUCKET.day ? t.peakDay : t.peakWeek)(
          euro(peak.total),
          format(parseISO(peak.date), "d MMM yy", { locale: dateLocale }),
        )
      : null;

  // Both bands share one time axis, so they share ONE crosshair: hovering
  // anywhere over the chart resolves the same bucket, and amount and frequency
  // read at the same instant. A hovered index can outlive a range switch, hence
  // the bounds-checked lookup.
  const hoveredIndex = cursor.hover?.data ?? null;
  const hoveredPoint = hoveredIndex !== null ? (points[hoveredIndex] ?? null) : null;
  const hoveredRolling = hoveredIndex !== null ? (rolling[hoveredIndex] ?? 0) : 0;
  // Bucket centre, the same anchor the bars and the date labels use.
  const crosshairLeft = hoveredIndex !== null && hoveredPoint ? ((hoveredIndex + 0.5) / points.length) * 100 : null;

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

  return (
    <GlowCard
      as="section"
      data-testid="search-timeline"
      className="px-6 py-5.5"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-4">
        <div>
          <CardTitle>{t.title}</CardTitle>
          <p className="mt-0.5 text-xs text-ink-4">{t.subtitle}</p>
        </div>
        {peakLabel && <span className="num text-xs text-ink-2">{peakLabel}</span>}
      </div>

      <SearchTimelineSearchField
        term={term}
        onTermChange={(next) => setParams({ term: next })}
      />

      <SearchTimelineHero
        summary={summary}
        range={range}
        hasQuery={hasQuery}
        onRangeChange={(next) => setParams({ range: next })}
      />

      <SearchTimelineSummaryLine
        statusMessage={resolveStatusMessage()}
        matches={hasMatches ? summary : null}
        window={{ from, to }}
      />

      <SearchTimelineChart
        chartRef={chartRef}
        width={width}
        points={points}
        rolling={rolling}
        maxRolling={Math.max(1, ...rolling)}
        yMax={niceCeil(Math.max(0, ...points.map((p) => p.total)))}
        ticks={timelineTicks(points, range, dateLocale)}
        windowDays={windowDays}
        bucket={bucket}
        hasMatches={hasMatches}
        term={debounced}
        rangeKey={range}
        cursor={cursor}
        crosshairLeft={crosshairLeft}
        // Empty buckets have nothing to open, so they keep the default cursor.
        bucketIsClickable={hoveredPoint !== null && hoveredPoint.count > 0}
        onBucketClick={goToBucketWeek}
      />

      <SearchTimelineLatest
        matches={latestMatches}
        onSelect={goToSpendingWeek}
      />

      <Tooltip
        mode="cursor"
        point={cursor.hover}
      >
        {hoveredPoint && (
          <SearchTimelineTooltipContent
            point={hoveredPoint}
            bucket={bucket}
            rolling={hoveredRolling}
            windowDays={windowDays}
          />
        )}
      </Tooltip>
    </GlowCard>
  );
};

export default StatisticsSearchTimeline;
