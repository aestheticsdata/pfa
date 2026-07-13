"use client";

// MOCK — there is no per-day spend endpoint (only per-month per-category), so
// the daily grid is a deterministic seeded pattern. The distribution bar, the
// sober-streak and the exceptional-pic count are all derived from that same
// generated pattern, so the card stays internally consistent.

import GlowCard from "@components/shared/GlowCard";
import getDayOfYear from "date-fns/getDayOfYear";

interface StatisticsHeatmapProps {
  year: number;
  now: Date;
}

type Level = "future" | "lvl-0" | "lvl-1" | "lvl-2" | "lvl-3" | "lvl-4" | "lvl-neg";
type FilledLevel = Exclude<Level, "future">;

const WEEKS = 53;
const DOW_LABELS = ["lun", "", "mer", "", "ven", "", "dim"];

const MONTH_COLS: { name: string; col: number }[] = [
  { name: "jan", col: 2 },
  { name: "fév", col: 6 },
  { name: "mar", col: 11 },
  { name: "avr", col: 15 },
  { name: "mai", col: 19 },
  { name: "jun", col: 24 },
  { name: "jul", col: 28 },
  { name: "aoû", col: 32 },
  { name: "sep", col: 37 },
  { name: "oct", col: 41 },
  { name: "nov", col: 45 },
  { name: "déc", col: 50 },
];

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

interface HeatmapModel {
  rows: Level[][]; // [dow 0..6][week 0..52]
  counts: Record<FilledLevel, number>;
  streak: number;
}

const emptyCounts = (): Record<FilledLevel, number> => ({
  "lvl-0": 0,
  "lvl-1": 0,
  "lvl-2": 0,
  "lvl-3": 0,
  "lvl-4": 0,
  "lvl-neg": 0,
});

/** Seeded LCG so the pattern is stable across renders (and SSR-safe). */
const buildHeatmap = (todayWeek: number, cap: number): HeatmapModel => {
  let seed = 42;
  const rand = () => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };

  const rows: Level[][] = Array.from({ length: 7 }, () => Array<Level>(WEEKS).fill("future"));
  for (let dow = 0; dow < 7; dow++) {
    for (let week = 0; week < WEEKS; week++) {
      if (week > todayWeek) continue; // stays "future"
      const v = rand() + (dow >= 5 ? 0.25 : 0); // weekends heavier
      if ((week === 10 && dow === 5) || (week === 18 && dow === 6)) {
        rows[dow][week] = "lvl-neg"; // exceptional spikes
      } else {
        rows[dow][week] = v < 0.25 ? "lvl-0" : v < 0.5 ? "lvl-1" : v < 0.7 ? "lvl-2" : v < 0.88 ? "lvl-3" : "lvl-4";
      }
    }
  }

  const counts = emptyCounts();
  let streak = 0;
  let best = 0;
  let seen = 0;
  outer: for (let week = 0; week <= todayWeek; week++) {
    for (let dow = 0; dow < 7; dow++) {
      const lv = rows[dow][week];
      if (lv === "future") continue;
      counts[lv] += 1;
      seen += 1;
      if (lv === "lvl-0" || lv === "lvl-1") {
        streak += 1;
        best = Math.max(best, streak);
      } else {
        streak = 0;
      }
      if (seen >= cap) break outer;
    }
  }

  return { rows, counts, streak: best };
};

const FILLED_ORDER: FilledLevel[] = ["lvl-0", "lvl-1", "lvl-2", "lvl-3", "lvl-4", "lvl-neg"];

/** "Carte de chaleur — quotidienne" — a daily-intensity calendar (MOCK). */
const StatisticsHeatmap = ({ year, now }: StatisticsHeatmapProps) => {
  const isCurrentYear = year === now.getFullYear();
  const realizedDays = isCurrentYear ? getDayOfYear(now) : getDayOfYear(new Date(year, 11, 31));
  const todayWeek = isCurrentYear ? Math.floor((getDayOfYear(now) - 1) / 7) : WEEKS - 1;

  const { rows, counts, streak } = buildHeatmap(todayWeek, realizedDays);

  const sober = counts["lvl-0"] + counts["lvl-1"];
  const common = counts["lvl-2"] + counts["lvl-3"];
  const distGroups = [
    { label: "sobres", n: sober, color: "oklch(0.45 0.06 148 / 0.7)" },
    { label: "courantes", n: common, color: "oklch(0.70 0.10 148 / 0.85)" },
    { label: "intenses", n: counts["lvl-4"], color: "var(--accent-strong)" },
    { label: "exceptionnelles", n: counts["lvl-neg"], color: "var(--exc)" },
  ];

  return (
    <GlowCard
      as="div"
      className="flex flex-col overflow-x-auto px-6 py-[22px]"
    >
      <div className="flex items-baseline justify-between gap-4">
        <h2 className="text-[14px] font-medium tracking-[-0.01em] text-ink">Carte de chaleur — quotidienne</h2>
        <span className="text-[12px] text-ink-4">
          {year} · {realizedDays} jours réalisés
        </span>
      </div>

      <div className="mt-[18px] min-w-[620px]">
        {/* month axis */}
        <div
          className="num mb-1 grid text-[9px] text-ink-4"
          style={{ gridTemplateColumns: "16px repeat(53, minmax(0, 1fr))" }}
        >
          {MONTH_COLS.map((m) => (
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
          style={{ gridTemplateColumns: "16px repeat(53, minmax(0, 1fr))" }}
        >
          {rows.map((weekArr, dow) => (
            <div
              // biome-ignore lint/suspicious/noArrayIndexKey: fixed 7-row day-of-week grid, positional slot never reorders
              key={dow}
              className="contents"
            >
              <span className="num self-center pr-1 text-right text-[9px] leading-[11px] text-ink-4">
                {DOW_LABELS[dow]}
              </span>
              {weekArr.map((lvl, week) => (
                <span
                  // biome-ignore lint/suspicious/noArrayIndexKey: fixed 53-week grid, positional cell never reorders
                  key={week}
                  className="aspect-square min-h-[9px] rounded-[2px]"
                  style={
                    lvl === "future"
                      ? { background: "transparent", border: "1px dashed var(--line)" }
                      : { background: CELL_BG[lvl] }
                  }
                />
              ))}
            </div>
          ))}
        </div>

        {/* scale legend */}
        <div className="num mt-4 flex items-center gap-2 text-[11px] text-ink-4">
          <span>0 €</span>
          <span className="flex gap-0.5">
            {(["lvl-0", "lvl-1", "lvl-2", "lvl-3", "lvl-4"] as FilledLevel[]).map((lvl) => (
              <span
                key={lvl}
                className="size-2.5 rounded-[2px]"
                style={{ background: CELL_BG[lvl] }}
              />
            ))}
          </span>
          <span>210 €/j</span>
          <span className="flex-1" />
          <span className="flex items-center gap-1.5">
            <span
              className="size-2.5 rounded-[2px]"
              style={{ background: "var(--exc)" }}
            />
            Pic exceptionnel
          </span>
        </div>
      </div>

      {/* derived insights, pinned to the bottom */}
      <div className="mt-auto flex flex-col gap-[22px] border-t border-line-soft pt-[22px]">
        <div>
          <div className="num mb-2.5 text-[11px] uppercase tracking-[0.07em] text-ink-4">Répartition des journées</div>
          <div className="flex h-4 gap-0.5 overflow-hidden rounded-[5px]">
            {FILLED_ORDER.filter((lvl) => counts[lvl] > 0).map((lvl) => (
              <span
                key={lvl}
                className="block h-full rounded-[2px]"
                style={{ background: DIST_BG[lvl], flexGrow: counts[lvl], flexBasis: 0 }}
              />
            ))}
          </div>
          <div className="num mt-[11px] flex flex-wrap gap-x-[18px] gap-y-[7px] text-[11px] text-ink-3">
            {distGroups.map((g) => (
              <span
                key={g.label}
                className="inline-flex items-center gap-1.5"
              >
                <i
                  className="size-2 shrink-0 rounded-[2px]"
                  style={{ background: g.color }}
                />
                {g.label} <b className="font-medium text-ink">{g.n}</b>
              </span>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-[18px]">
          <div>
            <div className="num text-[10.5px] uppercase leading-[1.35] tracking-[0.04em] text-ink-4">
              Journée la plus chargée
            </div>
            {/* MOCK — no per-day amounts */}
            <div className="num mt-[7px] text-[20px] tracking-[-0.01em] text-ink">210 €</div>
            <div className="mt-[3px] text-[11px] text-ink-4">hors exceptionnel</div>
          </div>
          <div>
            <div className="num text-[10.5px] uppercase leading-[1.35] tracking-[0.04em] text-ink-4">
              Plus longue série sobre
            </div>
            <div className="num mt-[7px] text-[20px] tracking-[-0.01em] text-ink">{streak} jours</div>
            <div className="mt-[3px] text-[11px] text-ink-4">journées calmes d&apos;affilée</div>
          </div>
          <div>
            <div className="num text-[10.5px] uppercase leading-[1.35] tracking-[0.04em] text-ink-4">
              Pics exceptionnels
            </div>
            <div className="num mt-[7px] text-[20px] tracking-[-0.01em] text-ink">{counts["lvl-neg"]}</div>
            <div className="mt-[3px] text-[11px] text-ink-4">ordinateur · vélo</div>
          </div>
        </div>
      </div>
    </GlowCard>
  );
};

export default StatisticsHeatmap;
