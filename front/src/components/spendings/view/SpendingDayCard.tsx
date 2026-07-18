"use client";

import { CATEGORY_FALLBACK } from "@components/categories/helpers/categoryColors";
import SpendingModal from "@components/spendings/common/spendingModal/SpendingModal";
import overspendLevel from "@components/spendings/helpers/overspendLevel";
import useSpendingDayItem from "@components/spendings/spendingDayItem/spendingItem/helpers/useSpendingDayItem";
import { TAG_CHIP } from "@components/spendings/view/helpers/tagChipClass";
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
      className={cn(
        "inline-flex cursor-pointer items-center gap-1.5 rounded-md border px-2.75 py-1.5 text-xs transition duration-100",
        active
          ? "border-elec bg-elec/12 text-ink"
          : "border-line bg-surface-hi text-ink-2 hover:border-ink-4 hover:text-ink",
      )}
      onClick={() => onSort(field)}
    >
      {label} <span className={cn("text-xs leading-none", active ? "text-elec" : "text-ink-4")}>{glyph}</span>
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
      className={cn(
        "flex h-125 flex-col overflow-hidden scroll-mt-42 rounded-2xl! min-[760px]:h-116 min-[768px]:scroll-mt-94",
        isToday
          ? "border border-elec bg-surface-elev shadow-[0_0_0_1px_var(--elec),0_16px_44px_oklch(0.72_0.15_230/0.24),inset_0_1px_0_oklch(1_0_0/0.06)]"
          : "pfa-card",
      )}
      data-sp-day={format(date, "yyyy-MM-dd")}
    >
      <div
        className={cn(
          "shrink-0 border-b bg-[linear-gradient(180deg,oklch(1_0_0/0.045),oklch(1_0_0/0.022))] px-4.5 pt-3.75 pb-3.25",
          isToday ? "border-elec/32" : "border-line",
        )}
      >
        <div className="flex items-baseline justify-between gap-3">
          <div className={cn("text-base font-semibold tracking-snug", isToday ? "text-elec" : "text-ink")}>
            {format(date, "dd MMM", { locale: fr })}
            <span className={cn("ml-2 text-xs font-normal capitalize", isToday ? "text-elec/85" : "text-ink-4")}>
              {format(date, "EEEE", { locale: fr })}
            </span>
          </div>
          <div
            className={cn(
              "whitespace-nowrap font-mono text-base font-medium tabular-nums",
              level === "warn" ? "text-warn" : level === "danger" ? "text-neg" : "text-ink",
            )}
          >
            <span className="mr-2 font-sans text-2xs font-medium tracking-widest text-ink-4">{dayCard.total}</span>
            {euro(displayTotal)}
            <span
              className={cn(
                "text-sm font-normal",
                level === "warn" ? "text-warn/70" : level === "danger" ? "text-neg/70" : "text-ink-3",
              )}
            >
              {" "}
              €
            </span>
          </div>
        </div>
        <div className="mt-3.25 flex flex-wrap gap-2">
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

      <div className="flex min-h-0 flex-auto flex-col px-4.5 pt-3.5 pb-4">
        {sorted.length > 0 ? (
          <>
            {dayCategories.length > 0 && (
              <div className="mb-1.5 flex shrink-0 flex-wrap gap-1.5">
                {dayCategories.map((c) => (
                  <button
                    key={c.key}
                    type="button"
                    className={cn(
                      TAG_CHIP,
                      "cursor-pointer transition-opacity duration-100 hover:opacity-100",
                      selectedCategory === c.key ? "opacity-100" : "opacity-70",
                    )}
                    style={{ color: c.color }}
                    onClick={() => onSelectCategory(selectedCategory === c.key ? null : c.key)}
                  >
                    {c.name}
                  </button>
                ))}
              </div>
            )}
            <div className="pfa-scroll-thin flex min-h-0 flex-auto flex-col overflow-y-auto pr-2">
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
          <div className="grid min-h-0 flex-auto place-items-center text-sm text-ink-4">{emptyLabel}</div>
        )}

        <button
          type="button"
          className="mt-2.5 flex shrink-0 cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-dashed border-line p-2.75 text-xs text-ink-4 transition duration-100 enabled:hover:border-[oklch(0.82_0.12_175/0.6)] enabled:hover:bg-[linear-gradient(100deg,oklch(0.84_0.14_148/0.08)_0%,oklch(0.82_0.13_175/0.09)_55%,oklch(0.8_0.12_210/0.1)_100%)] enabled:hover:text-[oklch(0.87_0.06_178)] disabled:cursor-not-allowed disabled:opacity-50"
          onClick={addSpending}
          disabled={!addSpendingEnabled}
        >
          <Plus className="size-3" />
          {dayCard.addSpending}
        </button>
      </div>

      {isToday && dailyBudget != null && (
        <div className="flex shrink-0 items-center justify-between border-t border-elec/24 bg-black/16 px-4.5 py-3 text-xs text-ink-3">
          <span>{spendings.dayItem.remainingBudget}</span>
          <span className="font-mono text-sm font-semibold tabular-nums text-elec">{dailyBudget} €</span>
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
