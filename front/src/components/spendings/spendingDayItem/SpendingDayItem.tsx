import { useEffect, useState } from "react";
import format from 'date-fns/format';
import { getDayOfYear, endOfMonth } from "date-fns";
import fr from "date-fns/locale/fr";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlusSquare } from '@fortawesome/free-solid-svg-icons';
import useSpendingDayItem from "@components/spendings/spendingDayItem/spendingItem/helpers/useSpendingDayItem";
import SpendingItemHeader from "@components/spendings/spendingDayItem/SpendingItemHeader";
import useClickSort from "@components/spendings/helpers/useClickSort";
import spendingsText from "@components/spendings/config/text";
import SpendingsListContainer from "@components/spendings/spendingsListContainer/SpendingListContainer";
import SpendingSort from "@components/spendings/spendingSort/SpendingSort";
import SpendingModal from "@components/spendings/common/spendingModal/SpendingModal"

import type { SpendingCompoundType, SpendingType } from "@components/spendings/types";
import { dividerClasses } from "@mui/material";
import CategoryComponent from "@components/common/Category";
import useDashboard from "@components/spendings/services/useDashboard";

interface SpendingDayItemProps {
  spendingsByDay: any;
  deleteSpending?: any;
  isLoading: boolean;
  date?: Date;
  user?: any; // TODO
  recurringType?: boolean;
  month?: any;
  total?: number;
}


const SpendingDayItem = ({ spendingsByDay, deleteSpending, isLoading, date, recurringType = false, month = null }: SpendingDayItemProps) => {
  const { remaining: remainingAmount } = useDashboard();
  const [todayCredits, setTodayCredits] = useState<number>(0);
  const isToday = getDayOfYear(date!) === getDayOfYear(Date.now());

  useEffect(() => {
    if (remainingAmount) {
      if (isToday) {
        const remainingDays = (getDayOfYear(endOfMonth(Date.now())) -  getDayOfYear(Date.now())) + 1;
        setTodayCredits(remainingAmount / remainingDays);
      }
    }
  }, [remainingAmount]);

  const {
    onClickSort,
    spendingsByDaySorted,
    setSpendingsByDaySorted,
  } = useClickSort();

  useEffect(() => {
    setSpendingsByDaySorted(spendingsByDay);
  }, [spendingsByDay]);

  const getRecurringsTotal = (recurrings: SpendingCompoundType) => {
    if (recurrings?.length > 0) {
      return recurrings.reduce((acc, curr) => {
        acc = acc + Number(curr.amount);
        return acc;
      }, 0);
    }
  }

  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  useEffect(() => {
    if (selectedCategory) {
      const spendingsFilteredByCategory = spendingsByDay.filter(
        (spending: SpendingType) => {
          if (spending.category === null && selectedCategory === "none") return true;
          return spending.category === selectedCategory;
        }
      );
      const total = spendingsFilteredByCategory.length > 0 ? spendingsFilteredByCategory.reduce((acc, spending) => {
        return Number(spending.amount) + acc;
      }, 0) : 0;
      spendingsFilteredByCategory.total = total.toFixed(2);
      setSpendingsByDaySorted(spendingsFilteredByCategory);
    } else {
      setSpendingsByDaySorted(spendingsByDay);
    }
  }, [selectedCategory]);

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

  const getCategories = (spendingsByDay) => Array.from(new Set(spendingsByDay.map((spending: SpendingType) => spending.category)))
  const getCategoryColor = (category) => spendingsByDay?.filter((spending) => spending.category === category)[0].categoryColor || "#fff";

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
          date={date!}
          recurringType={recurringType}
          isToday={isToday}
          addSpending={addSpending}
          addSpendingEnabled={addSpendingEnabled}
        />
        <div className={`flex ${recurringType || !isToday ? "justify-center" : "justify-between"} items-center font-poppins border-b border-b-grey3 mx-3`}>
          {spendingsByDaySorted &&
            <div className="flex justify-center gap-x-2 text-md">
              <div className="uppercase">{spendingsText.dayItem.total}</div>
              <div className="total-amount font-bold">
                {recurringType
                  ?
                  <div>{Number(getRecurringsTotal(spendingsByDaySorted) || 0).toFixed(2)} €</div>
                  :
                  <div>{Number(spendingsByDaySorted.total).toFixed(2)} €</div>
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
            {spendingsByDay &&
              getCategories(spendingsByDay).map(
                // @ts-ignore
                (category: string | null) =>
                  <div
                    key={(new Date()).getMilliseconds() + Math.trunc(Math.random()*1000000)}
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
            deleteSpending={deleteSpending}
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
