"use client";

import { useMemo } from "react";
import format from "date-fns/format";
import fr from "date-fns/locale/fr";
import { Plus } from "lucide-react";
import useSpendingDayItem from "@components/spendings/spendingDayItem/spendingItem/helpers/useSpendingDayItem";
import SpendingModal from "@components/spendings/common/spendingModal/SpendingModal";
import useDaySort, {
  type DaySortField,
} from "@components/spending/helpers/useDaySort";
import SpendingTxRow from "@components/spending/SpendingTxRow";
import { cn } from "@lib/utils";

import type { SpendingItem, SpendingListItem } from "@components/spendings/types";
import type { MonthRange } from "@components/spendings/interfaces/spendingDashboardTypes";

const FALLBACK_COLOR = "#94a3b8";
const UNCATEGORIZED_KEY = "none";

const formatAmount = (amount: number) =>
  Number(amount).toLocaleString("fr-FR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

interface DayCategory {
  key: string;
  name: string;
  color: string;
}

const SortButton = ({
  field,
  label,
  activeField,
  dir,
  onSort,
}: {
  field: DaySortField;
  label: string;
  activeField: DaySortField | null;
  dir: "asc" | "desc";
  onSort: (field: DaySortField) => void;
}) => {
  const active = activeField === field;
  const glyph = active ? (dir === "desc" ? "↓" : "↑") : "⇅";
  return (
    <button
      type="button"
      className={cn(active && "active")}
      onClick={() => onSort(field)}
    >
      {label} <span className="ar">{glyph}</span>
    </button>
  );
};

interface SpendingDayCardProps {
  date: Date;
  items: SpendingItem[];
  total: number;
  dailyBudget: number | null;
  isToday: boolean;
  month: MonthRange | null;
  selectedCategory: string | null;
  search: string;
  onSelectCategory: (key: string | null) => void;
}

/**
 * New glow day-card for the redesigned Dépenses timeline (Phase 3b).
 * Intentionally separate from the shared `SpendingDayItem` (which the
 * recurrings/overview view reuses) — see REFACTO_NOTES.md §9.
 */
const SpendingDayCard = ({
  date,
  items,
  total,
  dailyBudget,
  isToday,
  month,
  selectedCategory,
  search,
  onSelectCategory,
}: SpendingDayCardProps) => {
  const {
    isModalVisible,
    addSpendingEnabled,
    spending,
    isEditing,
    addSpending,
    closeModal,
    editSpending,
  } = useSpendingDayItem();

  const query = search.trim().toLowerCase();

  const filtered = useMemo(
    () =>
      items.filter((s) => {
        if (selectedCategory) {
          const key = s.category ?? UNCATEGORIZED_KEY;
          if (key !== selectedCategory) {
            return false;
          }
        }
        if (query) {
          const inLabel = (s.label ?? "").toLowerCase().includes(query);
          const inCategory = (s.category ?? "").toLowerCase().includes(query);
          if (!inLabel && !inCategory) {
            return false;
          }
        }
        return true;
      }),
    [items, selectedCategory, query],
  );

  const { field, dir, onSort, sorted } = useDaySort(filtered);

  const isFiltering = Boolean(selectedCategory) || query.length > 0;
  const displayTotal = isFiltering
    ? filtered.reduce((acc, s) => acc + Number(s.amount), 0)
    : total;
  const over = dailyBudget != null && displayTotal > dailyBudget;

  const dayCategories = useMemo<DayCategory[]>(() => {
    const map = new Map<string, DayCategory>();
    for (const s of items) {
      const key = s.category ?? UNCATEGORIZED_KEY;
      if (!map.has(key)) {
        map.set(key, {
          key,
          name: s.category ?? "sans catégorie",
          color: s.categoryColor || FALLBACK_COLOR,
        });
      }
    }
    return Array.from(map.values());
  }, [items]);

  const emptyLabel = items.length === 0 ? "Aucune dépense" : "Aucun résultat";

  return (
    <div className={cn("sp-day", isToday && "sp-day--today")}>
      <div className="sp-day-h">
        <div className="sp-day-h-top">
          <div className="sp-date">
            {format(date, "dd MMM", { locale: fr })}
            <span className="dow">{format(date, "EEEE", { locale: fr })}</span>
          </div>
          <div className={cn("sp-day-total", over && "over")}>
            <span className="tl">TOTAL</span>
            {formatAmount(displayTotal)}
            <span className="cur"> €</span>
          </div>
        </div>
        <div className="sp-sort">
          <SortButton
            field="label"
            label="Label"
            activeField={field}
            dir={dir}
            onSort={onSort}
          />
          <SortButton
            field="category"
            label="Catégories"
            activeField={field}
            dir={dir}
            onSort={onSort}
          />
          <SortButton
            field="amount"
            label="Montant"
            activeField={field}
            dir={dir}
            onSort={onSort}
          />
        </div>
      </div>

      <div className="sp-day-body">
        {sorted.length > 0 ? (
          <>
            {dayCategories.length > 0 && (
              <div className="sp-day-tags">
                {dayCategories.map((c) => (
                  <button
                    key={c.key}
                    type="button"
                    className={cn(
                      "sp-tag",
                      selectedCategory === c.key && "active",
                    )}
                    style={{ color: c.color }}
                    onClick={() =>
                      onSelectCategory(
                        selectedCategory === c.key ? null : c.key,
                      )
                    }
                  >
                    {c.name}
                  </button>
                ))}
              </div>
            )}
            <div className="sp-tx-list">
              {sorted.map((s) => (
                <SpendingTxRow
                  key={s.ID}
                  spending={s}
                  onEdit={editSpending as (s: SpendingItem) => void}
                />
              ))}
            </div>
          </>
        ) : (
          <div className="sp-day-empty">{emptyLabel}</div>
        )}

        <button
          type="button"
          className="sp-add-row"
          onClick={addSpending}
          disabled={!addSpendingEnabled}
        >
          <Plus className="size-3" />
          Ajouter une dépense ce jour
        </button>
      </div>

      {isToday && dailyBudget != null && (
        <div className="sp-day-budget">
          <span>Budget du jour maximum</span>
          <span className="v">{dailyBudget} €</span>
        </div>
      )}

      {isModalVisible && (
        <SpendingModal
          date={date}
          closeModal={closeModal}
          spending={spending as SpendingListItem | null}
          isEditing={isEditing}
          month={month}
        />
      )}
    </div>
  );
};

export default SpendingDayCard;
