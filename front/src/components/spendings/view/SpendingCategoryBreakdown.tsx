"use client";

import { ArrowDown, ArrowUp } from "lucide-react";
import { mockCategoryTrend } from "@components/spendings/view/helpers/mockSpending";
import { cn } from "@lib/utils";

export interface BreakdownRow {
  key: string;
  name: string;
  color: string;
  count: number;
  total: number;
  pct: number;
}

const formatAmount = (amount: number) =>
  Number(amount).toLocaleString("fr-FR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const Trend = ({ name }: { name: string }) => {
  // MOCK — needs previous-week data (see mockSpending.ts)
  const { direction, label } = mockCategoryTrend(name);
  return (
    <span
      className={cn(
        "num flex items-center justify-end gap-1 text-[11.5px]",
        direction === "up" && "text-neg",
        direction === "down" && "text-accent-strong",
        direction === "flat" && "text-ink-4",
      )}
    >
      {direction === "up" && <ArrowUp className="size-2.5" />}
      {direction === "down" && <ArrowDown className="size-2.5" />}
      {label}
    </span>
  );
};

interface SpendingCategoryBreakdownProps {
  rows: BreakdownRow[];
  rangeLabel: string;
}

/**
 * Full-width "Répartition par catégorie" pane for the current week.
 * Stacked bar + per-category swatch / name / count / % / amount / trend.
 * (Trend column is MOCK.)
 */
const SpendingCategoryBreakdown = ({
  rows,
  rangeLabel,
}: SpendingCategoryBreakdownProps) => {
  if (rows.length === 0) {
    return null;
  }

  return (
    <section className="sp-catrep">
      <div className="mb-[18px] flex items-baseline justify-between">
        <h2 className="text-[15px] font-semibold tracking-[-0.01em] text-ink">
          Répartition par catégorie
        </h2>
        <span className="text-xs text-ink-4">{rangeLabel} · semaine</span>
      </div>

      <div className="sp-cat-bar mb-[18px]" title="Répartition de la semaine">
        {rows.map((r) => (
          <span
            key={r.key}
            style={{ width: `${r.pct.toFixed(2)}%`, background: r.color }}
          />
        ))}
      </div>

      <div className="sp-cat-list">
        {rows.map((r) => (
          <div key={r.key} className="sp-cat-row">
            <span
              className="size-2 rounded-[2px]"
              style={{ background: r.color }}
            />
            <span className="flex min-w-0 items-baseline gap-2">
              <span className="truncate capitalize text-ink">{r.name}</span>
              <span className="num shrink-0 rounded-full border border-line-soft bg-background px-[7px] text-[10.5px] leading-[1.55] text-ink-3">
                {r.count}
              </span>
            </span>
            <span className="num text-right text-ink-2">
              {r.pct.toFixed(1).replace(".", ",")} %
            </span>
            <span className="num text-right text-ink">
              {formatAmount(r.total)} €
            </span>
            <Trend name={r.name} />
          </div>
        ))}
      </div>
    </section>
  );
};

export default SpendingCategoryBreakdown;
