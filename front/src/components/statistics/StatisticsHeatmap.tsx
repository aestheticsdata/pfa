"use client";

import { CardSectionHeader } from "@components/shared/CardSectionHeader";
import GlowCard from "@components/shared/GlowCard";
import { LegendItem } from "@components/shared/LegendItem";
import { buildHeatmap, LEVEL, monthColumns, SPEND_BANDS } from "@components/statistics/helpers/heatmapData";
import useDateLocale from "@i18n/useDateLocale";
import useFormat from "@i18n/useFormat";
import useTranslations from "@i18n/useTranslations";
import { CursorTooltip, useCursorHover } from "@lib/dataviz";
import { cn } from "@lib/utils";
import format from "date-fns/format";
import parseISO from "date-fns/parseISO";

import type { FilledLevel, HeatmapCell } from "@components/statistics/helpers/heatmapData";
import type { ExceptionalItem } from "@src/schemas/exceptionals";
import type { DailyStat } from "@src/schemas/stats";

interface StatisticsHeatmapProps {
  year: number;
  now: Date;
  /** Per-day spending totals for the year (COS-45); `undefined` while the request is in flight. */
  days: DailyStat[] | undefined;
  /** Exceptional purchases for the year — overlaid as lvl-neg days. */
  exceptionals: ExceptionalItem[];
}

const DOW_LABELS = ["lun", "", "mer", "", "ven", "", "dim"];

const CELL_BG: Record<FilledLevel, string> = {
  [LEVEL.ZERO]: "oklch(0.20 0.006 250)",
  [LEVEL.ONE]: "oklch(0.40 0.05 148 / 0.4)",
  [LEVEL.TWO]: "oklch(0.55 0.08 148 / 0.6)",
  [LEVEL.THREE]: "oklch(0.70 0.10 148 / 0.8)",
  [LEVEL.FOUR]: "var(--accent-strong)",
  [LEVEL.NEG]: "var(--exc)",
};

const DIST_BG: Record<FilledLevel, string> = {
  [LEVEL.ZERO]: "oklch(0.20 0.006 250)",
  [LEVEL.ONE]: "oklch(0.40 0.05 148 / 0.45)",
  [LEVEL.TWO]: "oklch(0.55 0.08 148 / 0.7)",
  [LEVEL.THREE]: "oklch(0.70 0.10 148 / 0.85)",
  [LEVEL.FOUR]: "var(--accent-strong)",
  [LEVEL.NEG]: "var(--exc)",
};

const FILLED_ORDER: FilledLevel[] = [...SPEND_BANDS, LEVEL.NEG];

// The hover tooltip wears the hovered cell/segment colour. CELL_BG/DIST_BG use
// alpha for the mid greens, so composite over the base surface to stay opaque;
// TIP_FG keeps the text readable on each level (dark on the light bands).
const tipBg = (color: string) => `linear-gradient(${color}, ${color}), var(--surface-base)`;
// A slightly lifted tint of the cell colour: enough to separate the tooltip
// from the page, subtle enough not to read as a bright ring on dark cells.
const tipBorder = (color: string) => `color-mix(in oklch, ${color} 82%, var(--ink) 18%)`;
const TIP_FG: Record<FilledLevel, string> = {
  [LEVEL.ZERO]: "var(--ink)",
  [LEVEL.ONE]: "var(--ink)",
  [LEVEL.TWO]: "var(--ink)",
  [LEVEL.THREE]: "var(--surface-base)",
  [LEVEL.FOUR]: "var(--surface-base)",
  [LEVEL.NEG]: "var(--surface-base)",
};

/** "Heatmap — daily" — daily-spend intensity calendar (COS-45). */
const StatisticsHeatmap = ({ year, now, days, exceptionals }: StatisticsHeatmapProps) => {
  const { euro0, pct1 } = useFormat();
  const statistics = useTranslations("statistics");
  const common = useTranslations("common");
  const dateLocale = useDateLocale();
  const { heatmap: t } = statistics;
  const cellTip = useCursorHover<HeatmapCell>();
  const distributionTip = useCursorHover<FilledLevel>();

  // Not yet loaded (or the request failed): show a placeholder rather than an
  // all-zero grid, which would read as a real, confident "sober all year".
  if (days === undefined) {
    return (
      <GlowCard
        as="div"
        className="flex flex-col overflow-x-auto px-6 py-5.5"
      >
        <CardSectionHeader
          title={t.title}
          meta={String(year)}
        />
        <div className="grid flex-1 place-items-center py-16 text-sm text-ink-4">{common.loading}</div>
      </GlowCard>
    );
  }

  const { rows, cells, weeks, counts, streak, scaleMax, busiest, exceptionalLabels, realizedDays } = buildHeatmap(
    year,
    now,
    days,
    exceptionals,
  );

  const gridColumns = `16px repeat(${weeks}, minmax(0, 1fr))`;
  const soberDays = counts[LEVEL.ZERO] + counts[LEVEL.ONE];
  const commonDays = counts[LEVEL.TWO] + counts[LEVEL.THREE];
  const distGroups = [
    { label: t.dist.sober, n: soberDays, color: "oklch(0.45 0.06 148 / 0.7)" },
    { label: t.dist.common, n: commonDays, color: "oklch(0.70 0.10 148 / 0.85)" },
    { label: t.dist.intense, n: counts[LEVEL.FOUR], color: "var(--accent-strong)" },
    { label: t.dist.exceptional, n: counts[LEVEL.NEG], color: "var(--exc)" },
  ];
  // Each colour band maps to its distribution group, so a hovered bar segment
  // (two bands share a group) explains itself.
  const groupForLevel: Record<FilledLevel, (typeof distGroups)[number]> = {
    [LEVEL.ZERO]: distGroups[0],
    [LEVEL.ONE]: distGroups[0],
    [LEVEL.TWO]: distGroups[1],
    [LEVEL.THREE]: distGroups[1],
    [LEVEL.FOUR]: distGroups[2],
    [LEVEL.NEG]: distGroups[3],
  };
  const peakLabels = exceptionalLabels.slice(0, 3).join(" · ");
  const distShare = (n: number) => pct1(realizedDays > 0 ? (n / realizedDays) * 100 : 0);

  return (
    <GlowCard
      as="div"
      className="flex flex-col overflow-x-auto px-6 py-5.5"
    >
      <CardSectionHeader
        title={t.title}
        meta={t.meta(year, realizedDays)}
      />

      <div className="mt-4.5 min-w-[620px]">
        {/* month axis */}
        <div
          className="num mb-1 grid text-3xs text-ink-4"
          style={{ gridTemplateColumns: gridColumns }}
        >
          {monthColumns(year, dateLocale).map((m) => (
            <span
              key={m.name}
              style={{ gridColumn: `${m.col} / span 4`, gridRow: 1 }}
            >
              {m.name}
            </span>
          ))}
        </div>

        {/* grid — one hover handler on the container resolves the cell by position
            (like StackedBar), so the tooltip follows the cursor across the grid. */}
        <div
          className="grid gap-0.5"
          style={{ gridTemplateColumns: gridColumns }}
          role="img"
          aria-label={t.title}
          onMouseMove={(e) => {
            const el = (e.target as HTMLElement).closest<HTMLElement>("[data-week]");
            if (!el) {
              return; // over a gap or the day-of-week label — keep the current tooltip
            }
            const cell = cells[Number(el.dataset.dow)]?.[Number(el.dataset.week)];
            if (cell) {
              cellTip.show(e.clientX, e.clientY, cell);
            } else {
              cellTip.clear(); // future / out-of-year cell
            }
          }}
          onMouseLeave={cellTip.clear}
        >
          {rows.map((weekArr, dow) => (
            <div
              // biome-ignore lint/suspicious/noArrayIndexKey: fixed 7-row day-of-week grid, positional slot never reorders
              key={dow}
              className="contents"
            >
              <span className="num self-center pr-1 text-right text-3xs leading-3 text-ink-4">{DOW_LABELS[dow]}</span>
              {weekArr.map((lvl, week) => {
                const filled = lvl !== LEVEL.FUTURE && lvl !== LEVEL.EMPTY;
                const style =
                  lvl === LEVEL.FUTURE
                    ? { background: "transparent", border: "1px dashed var(--line)" }
                    : lvl === LEVEL.EMPTY
                      ? { background: "transparent" }
                      : { background: CELL_BG[lvl] };
                return (
                  <span
                    // biome-ignore lint/suspicious/noArrayIndexKey: fixed week grid, positional cell never reorders
                    key={week}
                    className={cn("aspect-square min-h-[9px] rounded-xs", filled && "transition hover:brightness-150")}
                    style={style}
                    data-dow={dow}
                    data-week={week}
                  />
                );
              })}
            </div>
          ))}
        </div>

        {/* scale legend */}
        <div className="num mt-4 flex items-center gap-2 text-2xs text-ink-4">
          <span>0 €</span>
          <span className="flex gap-0.5">
            {SPEND_BANDS.map((lvl) => (
              <span
                key={lvl}
                className="size-2.5 rounded-xs"
                style={{ background: CELL_BG[lvl] }}
              />
            ))}
          </span>
          <span>{euro0(scaleMax)} €/j</span>
          <span className="flex-1" />
          <LegendItem
            swatch={
              <span
                className="size-2.5 rounded-xs"
                style={{ background: "var(--exc)" }}
              />
            }
          >
            {t.exceptionalPeak}
          </LegendItem>
        </div>
      </div>

      {/* derived insights, pinned to the bottom */}
      <div className="mt-auto flex flex-col gap-5.5 border-t border-line-soft pt-5.5">
        <div>
          <div className="num mb-2.5 text-2xs uppercase tracking-caps text-ink-4">{t.distributionTitle}</div>
          <div
            className="flex h-4 gap-0.5 overflow-hidden rounded-sm"
            role="img"
            aria-label={t.distributionTitle}
            onMouseMove={(e) => {
              const el = (e.target as HTMLElement).closest<HTMLElement>("[data-level]");
              if (el) {
                distributionTip.show(e.clientX, e.clientY, el.dataset.level as FilledLevel);
              }
              // over a gap — keep the current tooltip; onMouseLeave clears
            }}
            onMouseLeave={distributionTip.clear}
          >
            {FILLED_ORDER.filter((lvl) => counts[lvl] > 0).map((lvl) => (
              <span
                key={lvl}
                className="block h-full rounded-xs"
                style={{ background: DIST_BG[lvl], flexGrow: counts[lvl], flexBasis: 0 }}
                data-level={lvl}
              />
            ))}
          </div>
          <div className="num mt-3 flex flex-wrap gap-x-4.5 gap-y-2 text-2xs text-ink-3">
            {distGroups.map((g) => (
              <span
                key={g.label}
                className="inline-flex items-center gap-1.5"
              >
                <i
                  className="size-2 shrink-0 rounded-xs"
                  style={{ background: g.color }}
                />
                {g.label} <b className="font-medium text-ink">{g.n}</b>
              </span>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4.5">
          <div>
            <div className="num text-2xs uppercase leading-snug tracking-wider text-ink-4">{t.busiestDay}</div>
            <div className="num mt-2 text-xl tracking-snug text-ink">
              {busiest ? `${euro0(busiest.amount)} €` : "—"}
            </div>
            <div className="mt-1 text-2xs text-ink-4">{t.excludingExceptional}</div>
          </div>
          <div>
            <div className="num text-2xs uppercase leading-snug tracking-wider text-ink-4">{t.longestSoberStreak}</div>
            <div className="num mt-2 text-xl tracking-snug text-ink">{t.streakDays(streak)}</div>
            <div className="mt-1 text-2xs text-ink-4">{t.calmDays}</div>
          </div>
          <div>
            <div className="num text-2xs uppercase leading-snug tracking-wider text-ink-4">{t.exceptionalPeaks}</div>
            <div className="num mt-2 text-xl tracking-snug text-ink">{exceptionalLabels.length}</div>
            <div className="mt-1 text-2xs text-ink-4">{peakLabels || "—"}</div>
          </div>
        </div>
      </div>

      <CursorTooltip
        point={cellTip.hover}
        background={cellTip.hover ? tipBg(CELL_BG[cellTip.hover.data.level]) : undefined}
        color={cellTip.hover ? TIP_FG[cellTip.hover.data.level] : undefined}
        borderColor={cellTip.hover ? tipBorder(CELL_BG[cellTip.hover.data.level]) : undefined}
      >
        {cellTip.hover && (
          <>
            <div className="font-medium capitalize">
              {format(parseISO(cellTip.hover.data.date), "EEE d MMM", { locale: dateLocale })}
            </div>
            <div>{cellTip.hover.data.amount > 0 ? `${euro0(cellTip.hover.data.amount)} €` : t.tooltip.noSpend}</div>
            {cellTip.hover.data.exceptionals.length > 0 && (
              <div className="mt-1">
                <div className="font-medium">{t.tooltip.exceptionalLead}</div>
                {cellTip.hover.data.exceptionals.map((e) => (
                  <div key={`${e.label}-${e.amount}`}>{t.tooltip.exceptional(e.label, euro0(e.amount))}</div>
                ))}
              </div>
            )}
          </>
        )}
      </CursorTooltip>

      <CursorTooltip
        point={distributionTip.hover}
        background={distributionTip.hover ? tipBg(DIST_BG[distributionTip.hover.data]) : undefined}
        color={distributionTip.hover ? TIP_FG[distributionTip.hover.data] : undefined}
        borderColor={distributionTip.hover ? tipBorder(DIST_BG[distributionTip.hover.data]) : undefined}
      >
        {distributionTip.hover &&
          t.tooltip.distSegment(
            groupForLevel[distributionTip.hover.data].n,
            groupForLevel[distributionTip.hover.data].label,
            distShare(groupForLevel[distributionTip.hover.data].n),
          )}
      </CursorTooltip>
    </GlowCard>
  );
};

export default StatisticsHeatmap;
