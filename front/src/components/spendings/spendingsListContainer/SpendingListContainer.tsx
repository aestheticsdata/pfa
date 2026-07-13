import Spinner from "@components/common/Spinner";
import SpendingItem from "@components/spendings/spendingDayItem/spendingItem/SpendingItem";

import type { SpendingsListContainerType } from "@components/spendings/types";

const SpendingsListContainer = ({
  spendingsByDaySorted,
  toggleAddSpending,
  editSpending,
  isLoading,
  recurringType,
}: SpendingsListContainerType) => {
  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[120px]">
        <Spinner />
      </div>
    );
  }

  if (!spendingsByDaySorted?.length) {
    return <div className="flex justify-center items-center min-h-[80px] text-gray-500 text-xs">Aucune dépense</div>;
  }

  return (
    <div
      className={
        recurringType
          ? "recurrings-list-container flex flex-col gap-1 overflow-y-auto overflow-x-hidden max-h-[180px]"
          : "spendings-list-container flex flex-col gap-1 overflow-y-auto overflow-x-hidden max-h-[220px]"
      }
    >
      {spendingsByDaySorted.map((spending) => (
        <SpendingItem
          key={spending.ID}
          spending={spending}
          editCallback={editSpending}
          toggleAddSpending={toggleAddSpending}
          isRecurring={recurringType}
        />
      ))}
    </div>
  );
};

export default SpendingsListContainer;
