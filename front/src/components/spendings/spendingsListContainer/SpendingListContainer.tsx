import Spinner from "@components/common/Spinner";
import SpendingItem from "@components/spendings/spendingDayItem/spendingItem/SpendingItem";
import useTranslations from "@i18n/useTranslations";

import type { SpendingsListContainerType } from "@components/spendings/interfaces/spendingListTypes";

const SpendingsListContainer = ({
  spendingsByDaySorted,
  toggleAddSpending,
  editSpending,
  isLoading,
  recurringType,
}: SpendingsListContainerType) => {
  const spendings = useTranslations("spendings");

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[120px]">
        <Spinner />
      </div>
    );
  }

  if (!spendingsByDaySorted?.length) {
    return (
      <div className="flex justify-center items-center min-h-[80px] text-ink-5 text-xs">{spendings.list.empty}</div>
    );
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
