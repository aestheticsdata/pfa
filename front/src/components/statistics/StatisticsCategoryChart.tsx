"use client";

import { CardTitle } from "@components/shared/CardSectionHeader";
import GlowCard from "@components/shared/GlowCard";
import { MONTHS_FR, niceCeil } from "@components/statistics/helpers/statisticsData";
import useElementWidth from "@lib/dataviz/useElementWidth";
import { euro0 } from "@lib/format";

export interface CategorySeries {
  name: string;
  color: string;
  /** 12-slot Jan→Dec monthly spend for this category. */
  monthly: number[];
}

interface StatisticsCategoryChartProps {
  year: number;
  series: CategorySeries[];
  /** Number of leading months to plot (elapsed months for the current year). */
  monthsCount: number;
  now: Date;
}

const H = 340;
const PAD_T = 28;
const PAD_B = 54;
const PAD_L = 52;
const PAD_R = 16;
const Y0 = H - PAD_B; // 286
const PLOT_H = Y0 - PAD_T; // 258

const range = (n: number): number[] => Array.from({ length: n }, (_, i) => i);

/** "Dépenses mensuelles par catégorie" — grouped bars, one group per month and
 *  one bar per selected category. All data is real (from /statistics). */
const StatisticsCategoryChart = ({ year, series, monthsCount, now }: StatisticsCategoryChartProps) => {
  const [ref, width] = useElementWidth<HTMLDivElement>();

  const months = Math.max(1, monthsCount);
  const isCurrentYear = year === now.getFullYear();
  const cm = now.getMonth();

  const dataMax = Math.max(1, ...series.flatMap((s) => range(months).map((m) => s.monthly[m] ?? 0)));
  const yMax = niceCeil(dataMax);

  const plotW = Math.max(0, width - PAD_L - PAD_R);
  const slotW = plotW / months;
  const groupW = slotW * 0.62;
  const n = series.length;
  const gap = n > 1 ? 7 : 0;
  const barW = n > 0 ? (groupW - gap * (n - 1)) / n : 0;
  const labelFont = n >= 3 ? 8 : 9.5;

  const cx = (m: number) => PAD_L + slotW * (m + 0.5);
  const yFor = (v: number) => Y0 - (Math.max(0, v) / yMax) * PLOT_H;

  const gridRows = range(5).map((i) => ({
    y: Y0 - (i * PLOT_H) / 4,
    value: (yMax * i) / 4,
  }));

  const subtitle = isCurrentYear ? `${year} · janv. → ${MONTHS_FR[months - 1]}` : `${year}`;

  return (
    <GlowCard
      as="section"
      className="px-6 py-[22px]"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-4">
        <div>
          <CardTitle>Dépenses mensuelles par catégorie</CardTitle>
          <p className="mt-0.5 text-[12px] text-ink-4">{subtitle}</p>
        </div>
        <div className="flex flex-wrap items-center gap-[18px] text-[12px] text-ink-3">
          {series.map((s) => (
            <span
              key={s.name}
              className="inline-flex items-center gap-1.5 capitalize"
            >
              <i
                className="inline-block size-2.5 rounded-[2px]"
                style={{ background: s.color }}
              />
              {s.name}
            </span>
          ))}
        </div>
      </div>

      <div
        ref={ref}
        className="mt-[18px] w-full"
      >
        {width > 0 && (
          <svg
            viewBox={`0 0 ${width} ${H}`}
            width={width}
            height={H}
            className="block"
            role="img"
            aria-label={`Dépenses mensuelles par catégorie ${year}`}
          >
            {/* grid + y labels */}
            {gridRows.map((row) => (
              <g key={`grid-${row.value}`}>
                <line
                  x1={PAD_L}
                  x2={width - PAD_R}
                  y1={row.y}
                  y2={row.y}
                  stroke="var(--line-soft)"
                  strokeWidth={1}
                />
                <text
                  x={PAD_L - 12}
                  y={row.y + 3}
                  fontSize={10}
                  textAnchor="end"
                  fill="var(--ink-4)"
                  className="num"
                >
                  {euro0(row.value)}
                </text>
              </g>
            ))}

            {/* grouped bars */}
            {range(months).map((m) => {
              const gx = cx(m) - groupW / 2;
              return (
                <g key={`m-${m}`}>
                  {series.map((s, i) => {
                    const v = s.monthly[m] ?? 0;
                    if (v <= 0) return null;
                    const bx = gx + i * (barW + gap);
                    const by = yFor(v);
                    return (
                      <g key={s.name}>
                        <rect
                          x={bx}
                          y={by}
                          width={barW}
                          height={Y0 - by}
                          rx={3}
                          fill={s.color}
                          opacity={0.9}
                        />
                        <text
                          x={bx + barW / 2}
                          y={by - 6}
                          fontSize={labelFont}
                          textAnchor="middle"
                          fill="var(--ink-2)"
                          className="num"
                        >
                          {euro0(v)}
                        </text>
                      </g>
                    );
                  })}
                </g>
              );
            })}

            {/* x labels */}
            {range(months).map((m) => (
              <text
                key={`x-${m}`}
                x={cx(m)}
                y={Y0 + 20}
                fontSize={11}
                textAnchor="middle"
                fill={isCurrentYear && m === cm ? "var(--ink)" : "var(--ink-3)"}
              >
                {MONTHS_FR[m]}
              </text>
            ))}
          </svg>
        )}
      </div>
    </GlowCard>
  );
};

export default StatisticsCategoryChart;
