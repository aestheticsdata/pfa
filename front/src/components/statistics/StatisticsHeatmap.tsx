"use client";

import { CardSectionHeader } from "@components/shared/CardSectionHeader";
import GlowCard from "@components/shared/GlowCard";
import { LegendItem } from "@components/shared/LegendItem";
import { buildHeatmap, monthColumns } from "@components/statistics/helpers/heatmapData";
import { euro0 } from "@lib/format";
import common from "@text/common";
import statistics from "@text/statistics";

import type { FilledLevel } from "@components/statistics/helpers/heatmapData";
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
  "lvl-0": "oklch(0.20 0.006 250)",
  "lvl-1": "oklch(0.40 0.05 148 / 0.4)",
  "lvl-2": "oklch(0.55 0.08 148 / 0.6)",
  "lvl-3": "oklch(0.70 0.10 148 / 0.8)",
  "lvl-4": "var(--accent-strong)",
  "lvl-neg": "var(--exc)",
};

const DIST_BG: Record<FilledLevel, string> = {
  "lvl-0": "oklch(0.20 0.006 250)",
  "lvl-1": "oklch(0.40 0.05 148 / 0.45)",
  "lvl-2": "oklch(0.55 0.08 148 / 0.7)",
  "lvl-3": "oklch(0.70 0.10 148 / 0.85)",
  "lvl-4": "var(--accent-strong)",
  "lvl-neg": "var(--exc)",
};

const FILLED_ORDER: FilledLevel[] = ["lvl-0", "lvl-1", "lvl-2", "lvl-3", "lvl-4", "lvl-neg"];

/** "Carte de chaleur — quotidienne" — daily-spend intensity calendar (COS-45). */
const StatisticsHeatmap = ({ year, now, days, exceptionals }: StatisticsHeatmapProps) => {
  const { heatmap: t } = statistics;

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

  const { rows, weeks, counts, streak, scaleMax, busiest, exceptionalLabels, realizedDays } = buildHeatmap(
    year,
    now,
    days,
    exceptionals,
  );

  const gridColumns = `16px repeat(${weeks}, minmax(0, 1fr))`;
  const soberDays = counts["lvl-0"] + counts["lvl-1"];
  const commonDays = counts["lvl-2"] + counts["lvl-3"];
  const distGroups = [
    { label: t.dist.sober, n: soberDays, color: "oklch(0.45 0.06 148 / 0.7)" },
    { label: t.dist.common, n: commonDays, color: "oklch(0.70 0.10 148 / 0.85)" },
    { label: t.dist.intense, n: counts["lvl-4"], color: "var(--accent-strong)" },
    { label: t.dist.exceptional, n: counts["lvl-neg"], color: "var(--exc)" },
  ];
  const peakLabels = exceptionalLabels.slice(0, 3).join(" · ");

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
          {monthColumns(year).map((m) => (
            <span
              key={m.name}
              style={{ gridColumn: `${m.col} / span 4`, gridRow: 1 }}
            >
              {m.name}
            </span>
          ))}
        </div>

        {/* grid */}
        <div
          className="grid gap-0.5"
          style={{ gridTemplateColumns: gridColumns }}
        >
          {rows.map((weekArr, dow) => (
            <div
              // biome-ignore lint/suspicious/noArrayIndexKey: fixed 7-row day-of-week grid, positional slot never reorders
              key={dow}
              className="contents"
            >
              <span className="num self-center pr-1 text-right text-3xs leading-3 text-ink-4">{DOW_LABELS[dow]}</span>
              {weekArr.map((lvl, week) => (
                <span
                  // biome-ignore lint/suspicious/noArrayIndexKey: fixed 53-week grid, positional cell never reorders
                  key={week}
                  className="aspect-square min-h-[9px] rounded-xs"
                  style={
                    lvl === "future"
                      ? { background: "transparent", border: "1px dashed var(--line)" }
                      : lvl === "empty"
                        ? { background: "transparent" }
                        : { background: CELL_BG[lvl] }
                  }
                />
              ))}
            </div>
          ))}
        </div>

        {/* scale legend */}
        <div className="num mt-4 flex items-center gap-2 text-2xs text-ink-4">
          <span>0 €</span>
          <span className="flex gap-0.5">
            {(["lvl-0", "lvl-1", "lvl-2", "lvl-3", "lvl-4"] as FilledLevel[]).map((lvl) => (
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
          <div className="flex h-4 gap-0.5 overflow-hidden rounded-sm">
            {FILLED_ORDER.filter((lvl) => counts[lvl] > 0).map((lvl) => (
              <span
                key={lvl}
                className="block h-full rounded-xs"
                style={{ background: DIST_BG[lvl], flexGrow: counts[lvl], flexBasis: 0 }}
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
    </GlowCard>
  );
};

export default StatisticsHeatmap;
