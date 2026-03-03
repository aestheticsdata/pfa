import { useEffect, useState } from "react";
import { getDayOfYear, endOfMonth } from "date-fns";
import useSpendingDayItem from "@components/spendings/spendingDayItem/spendingItem/helpers/useSpendingDayItem";
import SpendingItemHeader from "@components/spendings/spendingDayItem/SpendingItemHeader";
import useClickSort from "@components/spendings/helpers/useClickSort";
import spendingsText from "@components/spendings/config/text";
import SpendingsListContainer from "@components/spendings/spendingsListContainer/SpendingListContainer";
import SpendingSort from "@components/spendings/spendingSort/SpendingSort";
import SpendingModal from "@components/spendings/common/spendingModal/SpendingModal"
import type { AuthUser } from "@auth/types";

import type { SpendingItem, SpendingListItem } from "@components/spendings/types";
import type { MonthRange } from "@components/spendings/interfaces/spendingDashboardTypes";
import CategoryComponent from "@components/common/Category";
import useDashboard from "@components/spendings/services/useDashboard";

interface SpendingDayItemProps {
  spendingsByDay: SpendingListItem[];
  isLoading: boolean;
  date?: Date;
  user?: AuthUser | null;
  recurringType?: boolean;
  month?: MonthRange | null;
  total?: number;
}


const SpendingDayItem = ({ spendingsByDay, isLoading, date, recurringType = false, month = null, total = 0 }: SpendingDayItemProps) => {
  const { remaining: remainingAmount } = useDashboard();
  const [todayCredits, setTodayCredits] = useState<number>(0);
  const [isToday, setIsToday] = useState(false);
  const [displayTotal, setDisplayTotal] = useState<number>(total);

  useEffect(() => {
    if (date) {
      setIsToday(getDayOfYear(date) === getDayOfYear(Date.now()));
    }
  }, [date]);

  useEffect(() => {
    if (remainingAmount && isToday) {
      const remainingDays = (getDayOfYear(endOfMonth(Date.now())) - getDayOfYear(Date.now())) + 1;
      setTodayCredits(remainingAmount / remainingDays);
    }
  }, [remainingAmount, isToday]);

  const {
    onClickSort,
    spendingsByDaySorted,
    setSpendingsByDaySorted,
  } = useClickSort();

  useEffect(() => {
    setSpendingsByDaySorted(spendingsByDay);
    setDisplayTotal(total);
  }, [spendingsByDay, setSpendingsByDaySorted, total]);

  const getRecurringsTotal = (recurrings: SpendingListItem[]) => {
    if (recurrings?.length > 0) {
      return recurrings.reduce((acc, curr) => {
        return acc + Number(curr.amount);
      }, 0);
    }
    return 0;
  }

  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  useEffect(() => {
    if (selectedCategory) {
      const spendingsFilteredByCategory = spendingsByDay.filter(
        (spending) => {
          if (!("category" in spending)) {
            return false;
          }
          if (spending.category === null && selectedCategory === "none") return true;
          return spending.category === selectedCategory;
        }
      );
      const filteredTotal = spendingsFilteredByCategory.length > 0 ? spendingsFilteredByCategory.reduce((acc, spending) => {
        return spending.amount + acc;
      }, 0) : 0;
      setSpendingsByDaySorted(spendingsFilteredByCategory);
      setDisplayTotal(filteredTotal);
    } else {
      setSpendingsByDaySorted(spendingsByDay);
      setDisplayTotal(total);
    }
  }, [selectedCategory, setSpendingsByDaySorted, spendingsByDay, total]);

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

  const categorySpendings = spendingsByDay.filter((spending): spending is SpendingItem => "category" in spending);
  const getCategories = (items: SpendingItem[]) =>
    Array.from(new Set(items.map((spending) => spending.category).filter((category): category is string | null => category !== undefined)));
  const getCategoryColor = (category: string | null) =>
    categorySpendings.find((spending) => spending.category === category)?.categoryColor ?? "#fff";

  return (
    <div
      className={`rounded bg-spendingDayBackground
      ${recurringType
        ? "w-full md:w-[400px] h-[265px]"
        : "w-full md:w-[490px] h-[350px] md:m-2"
      }`}
    >
      <div className="flex flex-col">
        <div className="relative">
          {
            isModalVisible ?
              <SpendingModal
                date={date}
                closeModal={closeModal}
                spending={spending}
                recurringType={recurringType}
                isEditing={isEditing}
                month={month}
              />
              :
              null
          }
        </div>
        <SpendingItemHeader
          date={date}
          recurringType={recurringType}
          isToday={isToday}
          addSpending={addSpending}
          addSpendingEnabled={addSpendingEnabled}
        />
        <div className={`flex ${recurringType || !isToday ? "justify-center" : "justify-between"} items-center font-poppins border-b border-b-grey3 mx-3`}>
          {spendingsByDaySorted.length > 0 &&
            <div className="flex justify-center gap-x-2 text-md">
              <div className="uppercase">{spendingsText.dayItem.total}</div>
              <div className="total-amount font-bold">
                {recurringType
                  ?
                  <div>{Number(getRecurringsTotal(spendingsByDaySorted) || 0).toFixed(2)} €</div>
                  :
                  <div>{Number(displayTotal).toFixed(2)} €</div>
                }
              </div>
            </div>
          }
          {!recurringType && isToday &&
            <div className="text-xxs">
              <span>{spendingsText.dayItem.remainingBudget}</span> <span className="font-bold">{Math.trunc(todayCredits)} €</span>
            </div>
          }
        </div>
        {!recurringType &&
          <div className="flex overflow-y-auto max-h-7 bg-white space-x-2 border-b border-b-grey2 mx-3 py-1 justify-between">
            <div className="flex flex-row space-x-1">
            {categorySpendings.length > 0 &&
              getCategories(categorySpendings).map(
                (category: string | null) =>
                  <div
                    key={category ?? "none"}
                    className="cursor-pointer"
                    onClick={() => {
                      const nextCategory = category ?? "none";
                      setSelectedCategory(nextCategory);
                    }}
                  >
                    <CategoryComponent
                      item={{category: category ?? "none", categoryColor: getCategoryColor(category) }}
                      isDynamic
                      isClicked={selectedCategory === (category ?? "none")}
                    />
                  </div>
                )
            }
            </div>
            <div
              className=""
              onClick={() => {setSelectedCategory(null)}}
            >
              {spendingsByDaySorted.length > 0 ?
                <div className="bg-grey4 text-white hover:bg-grey2 cursor-pointer text-tiny uppercase rounded-sm border px-1">{spendingsText.dayItem.filterResetLabel}</div>
                :
                <div className="h-3"></div>
              }
            </div>
          </div>
        }
        <SpendingSort
          recurringType={recurringType}
          onClickSort={onClickSort}
        />
        <div className="flex flex-col mt-2">
          <SpendingsListContainer
            spendingsByDaySorted={spendingsByDaySorted}
            toggleAddSpending={toggleAddSpending}
            editSpending={editSpending}
            isLoading={isLoading}
            recurringType={recurringType}
          />
        </div>
      </div>
    </div>
  );
};

export default SpendingDayItem;
