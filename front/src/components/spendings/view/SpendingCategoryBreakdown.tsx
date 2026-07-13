"use client";

import { useState } from "react";
import { mockCategoryTrend } from "@components/spendings/view/helpers/mockSpending";
import SpendingsListModal from "@components/spendings/spendingsListModal/SpendingsListModal";
import { WEEKLY } from "@components/spendings/config/constants";
import { CategoryBarTooltip, CategoryTrend } from "@lib/dataviz";

export interface BreakdownRow {
  key: string;
  category: string | null;
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

// MOCK — needs previous-week data (see mockSpending.ts). De-mocks with COS-35.
const Trend = ({ name }: { name: string }) => (
  <CategoryTrend {...mockCategoryTrend(name)} />
);

interface SpendingCategoryBreakdownProps {
  rows: BreakdownRow[];
  rangeLabel: string;
}

interface BarHover {
  row: BreakdownRow;
  x: number;
  y: number;
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
  const [selected, setSelected] = useState<BreakdownRow | null>(null);
  const [hover, setHover] = useState<BarHover | null>(null);

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

      <div className="sp-cat-bar mb-[18px]">
        {rows.map((r) => (
          <span
            key={r.key}
            role="img"
            aria-label={`${r.name} : ${r.pct.toFixed(1).replace(".", ",")} % (${formatAmount(r.total)} €)`}
            style={{ width: `${r.pct.toFixed(2)}%`, background: r.color }}
            onMouseMove={(e) => setHover({ row: r, x: e.clientX, y: e.clientY })}
            onMouseLeave={() => setHover(null)}
          />
        ))}
      </div>

      <div className="sp-cat-list">
        {rows.map((r) => (
          <button
            key={r.key}
            type="button"
            onClick={() => setSelected(r)}
            className="sp-cat-row w-full text-left"
          >
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
          </button>
        ))}
      </div>

      {hover && (
        <CategoryBarTooltip
          point={{ x: hover.x, y: hover.y }}
          datum={{ ...hover.row, trend: mockCategoryTrend(hover.row.name) }}
        />
      )}

      {selected && (
        <SpendingsListModal
          handleClickOutside={() => setSelected(null)}
          periodType={WEEKLY}
          categoryInfos={{
            value: selected.total,
            category: selected.category,
            categoryColor: selected.color,
          }}
          total={selected.total}
        />
      )}
    </section>
  );
};

export default SpendingCategoryBreakdown;
