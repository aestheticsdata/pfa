"use client";

import { CATEGORY_FALLBACK } from "@components/categories/helpers/categoryColors";
import SpendingModal from "@components/spendings/common/spendingModal/SpendingModal";
import overspendLevel from "@components/spendings/helpers/overspendLevel";
import useSpendingDayItem from "@components/spendings/spendingDayItem/spendingItem/helpers/useSpendingDayItem";
import useDaySort from "@components/spendings/view/helpers/useDaySort";
import SpendingTxRow from "@components/spendings/view/SpendingTxRow";
import { euro } from "@lib/format";
import { cn } from "@lib/utils";
import spendings from "@text/spendings";
import format from "date-fns/format";
import fr from "date-fns/locale/fr";
import { Plus } from "lucide-react";
import { useMemo } from "react";

import type { MonthRange } from "@components/spendings/interfaces/spendingDashboardTypes";
import type { SpendingItem, SpendingListItem } from "@components/spendings/types";
import type { DaySortField } from "@components/spendings/view/helpers/useDaySort";

const FALLBACK_COLOR = CATEGORY_FALLBACK;
const UNCATEGORIZED_KEY = "none";

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
  /** The day's share of the weekly ceiling — threshold for the total colour (COS-34). */
  ceilingPerDay: number | null;
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
  ceilingPerDay,
  isToday,
  month,
  selectedCategory,
  search,
  onSelectCategory,
}: SpendingDayCardProps) => {
  const { sortItem, dayCard } = spendings;
  const { isModalVisible, addSpendingEnabled, spending, isEditing, addSpending, closeModal, editSpending } =
    useSpendingDayItem();

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
  const displayTotal = isFiltering ? filtered.reduce((acc, s) => acc + Number(s.amount), 0) : total;
  const level = overspendLevel(displayTotal, ceilingPerDay);

  const dayCategories = useMemo<DayCategory[]>(() => {
    const map = new Map<string, DayCategory>();
    for (const s of items) {
      const key = s.category ?? UNCATEGORIZED_KEY;
      if (!map.has(key)) {
        map.set(key, {
          key,
          name: s.category ?? spendings.noCategory,
          color: s.categoryColor || FALLBACK_COLOR,
        });
      }
    }
    return Array.from(map.values());
  }, [items]);

  const emptyLabel = items.length === 0 ? spendings.list.empty : dayCard.noResults;

  return (
    <div
      className={cn("sp-day", isToday && "sp-day--today")}
      data-sp-day={format(date, "yyyy-MM-dd")}
    >
      <div className="sp-day-h">
        <div className="sp-day-h-top">
          <div className="sp-date">
            {format(date, "dd MMM", { locale: fr })}
            <span className="dow">{format(date, "EEEE", { locale: fr })}</span>
          </div>
          <div className={cn("sp-day-total", level !== "normal" && level)}>
            <span className="tl">{dayCard.total}</span>
            {euro(displayTotal)}
            <span className="cur"> €</span>
          </div>
        </div>
        <div className="sp-sort">
          <SortButton
            field="label"
            label={sortItem.label}
            activeField={field}
            dir={dir}
            onSort={onSort}
          />
          <SortButton
            field="category"
            label={sortItem.category}
            activeField={field}
            dir={dir}
            onSort={onSort}
          />
          <SortButton
            field="amount"
            label={sortItem.amount}
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
                    className={cn("sp-tag", selectedCategory === c.key && "active")}
                    style={{ color: c.color }}
                    onClick={() => onSelectCategory(selectedCategory === c.key ? null : c.key)}
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
          {dayCard.addSpending}
        </button>
      </div>

      {isToday && dailyBudget != null && (
        <div className="sp-day-budget">
          <span>{spendings.dayItem.remainingBudget}</span>
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
