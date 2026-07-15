import SpendingModal from "@components/spendings/common/spendingModal/SpendingModal";
import spendingsText from "@components/spendings/config/text";
import useClickSort from "@components/spendings/helpers/useClickSort";
import useDashboard from "@components/spendings/services/useDashboard";
import useSpendingDayItem from "@components/spendings/spendingDayItem/spendingItem/helpers/useSpendingDayItem";
import SpendingSort from "@components/spendings/spendingSort/SpendingSort";
import SpendingsListContainer from "@components/spendings/spendingsListContainer/SpendingListContainer";
import { cn } from "@lib/utils";
import { endOfMonth, getDayOfYear } from "date-fns";
import format from "date-fns/format";
import fr from "date-fns/locale/fr";
import { Plus } from "lucide-react";
import { useState } from "react";

import type { AuthUser } from "@auth/types";
import type { MonthRange } from "@components/spendings/interfaces/spendingDashboardTypes";
import type { SpendingItem as SpendingItemType, SpendingListItem } from "@components/spendings/types";

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
    categorySpendings.find((s) => s.category === category)?.categoryColor ?? "#94a3b8";

  return (
    <div
      className={cn(
        "relative bg-gradient-to-br from-[#121212] via-[#0a0a0a] to-black rounded-lg border overflow-hidden transition-all shadow-xl flex flex-col h-full",
        isToday ? "border-cyan-300" : "border-gray-800/50 hover:border-gray-700/50",
      )}
    >
      {/* Header */}
      <div className="bg-linear-to-r from-gray-800/60 to-gray-800/40 px-4 py-2.5 border-b border-gray-700/50 shrink-0">
        <div className="flex items-center justify-between mb-2">
          <div className={cn("text-sm", isToday ? "text-cyan-300 font-semibold" : "text-gray-200")}>
            {date ? format(date, "dd MMM yyyy", { locale: fr }) : "—"}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-gray-400 text-xs uppercase tracking-wide">{spendingsText.dayItem.total}</span>
            <span className="text-gray-100 text-sm tabular-nums">{Number(displayTotal).toFixed(2)} €</span>
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
                  {category ?? "sans catégorie"}
                </button>
              );
            })}
            {selectedCategory && (
              <button
                type="button"
                onClick={() => setSelectedCategory(null)}
                className="px-2 py-0.5 rounded text-2xs uppercase font-medium bg-gray-700/60 text-gray-200 hover:bg-gray-600"
              >
                {spendingsText.dayItem.filterResetLabel}
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
            className="mt-auto w-full inline-flex items-center justify-center gap-1.5 py-2 rounded-md border border-dashed border-gray-700/60 text-gray-500 text-xs uppercase tracking-wide font-medium transition-all hover:border-cyan-500/60 hover:text-cyan-400 hover:bg-cyan-500/5 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:border-gray-700/60 disabled:hover:text-gray-500 disabled:hover:bg-transparent"
          >
            <Plus className="w-3.5 h-3.5" />
            Ajouter une dépense
          </button>
        )}

        {!recurringType && isToday && (
          <div className="mt-2 pt-2 border-t border-gray-800/50 flex items-center justify-between text-xs">
            <span className="text-gray-500">{spendingsText.dayItem.remainingBudget}</span>
            <span className="text-cyan-400 font-semibold">{Math.trunc(todayCredits)} €</span>
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
    </div>
  );
};

export default SpendingDayItem;
