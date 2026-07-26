import { CATEGORY_FALLBACK } from "@components/categories/helpers/categoryColors";
import GlowCard from "@components/shared/GlowCard";
import SpendingModal from "@components/spendings/common/spendingModal/SpendingModal";
import useClickSort from "@components/spendings/helpers/useClickSort";
import useDashboard from "@components/spendings/services/useDashboard";
import useSpendingDayItem from "@components/spendings/spendingDayItem/spendingItem/helpers/useSpendingDayItem";
import SpendingSort from "@components/spendings/spendingSort/SpendingSort";
import SpendingsListContainer from "@components/spendings/spendingsListContainer/SpendingListContainer";
import useDateLocale from "@i18n/useDateLocale";
import useFormat from "@i18n/useFormat";
import useTranslations from "@i18n/useTranslations";
import { cn } from "@lib/utils";
import { endOfMonth, getDayOfYear } from "date-fns";
import format from "date-fns/format";
import { Plus } from "lucide-react";
import { useState } from "react";

import type { AuthUser } from "@auth/interfaces/authTypes";
import type {
  SpendingItem as SpendingItemType,
  SpendingListItem,
} from "@components/spendings/interfaces/spendingListTypes";
import type { MonthRange } from "@lib/interfaces/dateRangeTypes";

interface SpendingDayItemProps {
  spendingsByDay: SpendingListItem[];
  isLoading: boolean;
  date?: Date;
  user?: AuthUser | null;
  recurringType?: boolean;
  month?: MonthRange | null;
  total?: number;
}

const SpendingDayItem = ({
  spendingsByDay,
  isLoading,
  date,
  recurringType = false,
  month = null,
  total = 0,
}: SpendingDayItemProps) => {
  const spendingsText = useTranslations("spendings");
  const { euro } = useFormat();
  const dateLocale = useDateLocale();
  const { dayItem } = spendingsText;
  const { remaining: remainingAmount } = useDashboard();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [today] = useState(() => Date.now());
  const isToday = date ? getDayOfYear(date) === getDayOfYear(today) : false;

  const todayCredits =
    remainingAmount && isToday ? remainingAmount / (getDayOfYear(endOfMonth(today)) - getDayOfYear(today) + 1) : 0;

  const spendingsFilteredByCategory = selectedCategory
    ? spendingsByDay.filter((spending) => {
        if (!("category" in spending)) {
          return false;
        }
        if (spending.category === null && selectedCategory === "none") {
          return true;
        }
        return spending.category === selectedCategory;
      })
    : spendingsByDay;

  const { onClickSort, spendingsByDaySorted } = useClickSort(spendingsFilteredByCategory);

  const displayTotal = selectedCategory
    ? spendingsFilteredByCategory.reduce((acc, spending) => acc + Number(spending.amount), 0)
    : total;

  const {
    isModalVisible,
    addSpendingEnabled,
    spending,
    isEditing,
    addSpending,
    closeModal,
    toggleAddSpending,
    editSpending,
  } = useSpendingDayItem();

  const categorySpendings = spendingsByDay.filter((s): s is SpendingItemType => "category" in s);
  const getCategories = (items: SpendingItemType[]) =>
    Array.from(new Set(items.map((s) => s.category).filter((c): c is string | null => c !== undefined)));
  const getCategoryColor = (category: string | null) =>
    categorySpendings.find((s) => s.category === category)?.categoryColor ?? CATEGORY_FALLBACK;

  return (
    <GlowCard className={cn("relative overflow-hidden transition-all flex flex-col h-full", isToday && "border-elec")}>
      {/* Header */}
      <div className="bg-linear-to-r from-surface-hi/60 to-surface-hi/40 px-4 py-2.5 border-b border-line shrink-0">
        <div className="flex items-center justify-between mb-2">
          <div className={cn("text-sm", isToday ? "text-elec font-semibold" : "text-ink-2")}>
            {date ? format(date, "dd MMM yyyy", { locale: dateLocale }) : "—"}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-ink-4 text-xs uppercase tracking-wide">{dayItem.total}</span>
            <span className="text-ink text-sm tabular-nums">{euro(displayTotal)} €</span>
          </div>
        </div>

        {/* Sort buttons */}
        <SpendingSort
          recurringType={recurringType}
          onClickSort={onClickSort}
        />
      </div>

      {/* Body */}
      <div className="p-3 flex-1 flex flex-col">
        {!recurringType && categorySpendings.length > 0 && (
          <div className="flex flex-wrap items-center gap-1 mb-2">
            {getCategories(categorySpendings).map((category) => {
              const key = category ?? "none";
              const color = getCategoryColor(category);
              const isClicked = selectedCategory === key;
              return (
                <button
                  type="button"
                  key={key}
                  onClick={() => setSelectedCategory(key)}
                  className={cn(
                    "px-2 py-0.5 rounded text-2xs uppercase font-medium transition-all border cursor-pointer",
                    isClicked ? "border-transparent" : "border-transparent opacity-70 hover:opacity-100",
                  )}
                  style={{
                    backgroundColor: color + (isClicked ? "" : "30"),
                    color: isClicked ? "#0a0a0a" : color,
                  }}
                >
                  {category ?? spendingsText.noCategory}
                </button>
              );
            })}
            {selectedCategory && (
              <button
                type="button"
                onClick={() => setSelectedCategory(null)}
                className="px-2 py-0.5 rounded text-2xs uppercase font-medium bg-surface-hi text-ink-2 hover:bg-surface-hover"
              >
                {dayItem.filterResetLabel}
              </button>
            )}
          </div>
        )}

        <SpendingsListContainer
          spendingsByDaySorted={spendingsByDaySorted}
          toggleAddSpending={toggleAddSpending}
          editSpending={editSpending}
          isLoading={isLoading}
          recurringType={recurringType}
        />

        {!recurringType && (
          <button
            type="button"
            onClick={addSpending}
            disabled={!addSpendingEnabled}
            className="mt-auto w-full inline-flex items-center justify-center gap-1.5 py-2 rounded-md border border-dashed border-line text-ink-5 text-xs uppercase tracking-wide font-medium transition-all hover:border-elec/60 hover:text-elec hover:bg-elec/5 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:border-line disabled:hover:text-ink-5 disabled:hover:bg-transparent"
          >
            <Plus className="w-3.5 h-3.5" />
            {dayItem.addSpending}
          </button>
        )}

        {!recurringType && isToday && (
          <div className="mt-2 pt-2 border-t border-line-soft flex items-center justify-between text-xs">
            <span className="text-ink-5">{dayItem.remainingBudget}</span>
            <span className="text-elec font-semibold">{Math.trunc(todayCredits)} €</span>
          </div>
        )}
      </div>

      {isModalVisible && (
        <SpendingModal
          date={date}
          closeModal={closeModal}
          spending={spending}
          recurringType={recurringType}
          isEditing={isEditing}
          month={month}
        />
      )}
    </GlowCard>
  );
};

export default SpendingDayItem;
