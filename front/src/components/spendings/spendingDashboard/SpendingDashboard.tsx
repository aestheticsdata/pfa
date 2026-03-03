import SpendingDayItem from '@components/spendings/spendingDayItem/SpendingDayItem';
import MonthlyBudget from '@components/spendings/spendingDashboard/monthlyBudget/MonthlyBudget';
import WeeklyStats from "@components/spendings/spendingDashboard/weeklyStats/WeeklyStats";
import WeeklyCharts from "@components/spendings/spendingDashboard/weeklyCharts/WeeklyCharts";
import MonthlyCharts from "@components/spendings/spendingDashboard/monthlyCharts/MonthlyCharts";
import { useAuth } from "@auth/context/AuthContext";
import useReccurings from "@components/spendings/services/useReccurings";
import useBlur from "@components/common/helpers/blurHelper";

import type { MonthRange } from "@components/spendings/interfaces/spendingDashboardTypes";

interface SpendingDashboardProps {
  month: MonthRange;
}

const SpendingDashboard = ({ month }: SpendingDashboardProps) => {
  const { isBlurActive } = useBlur();
  const { user } = useAuth();
  const { recurrings, isLoading: isRecurringsLoading, error } = useReccurings();

  if (error) {
    throw error;
  }

  return (
    <div className={`hidden md:flex justify-around mt-14 items-center w-full h-72 bg-grey2 z-30 fixed ${isBlurActive && "blur-xs"}`}>
      <WeeklyStats />
      <MonthlyBudget />
      <MonthlyCharts />
      <WeeklyCharts />
      <SpendingDayItem
        spendingsByDay={recurrings}
        total={0}
        isLoading={isRecurringsLoading}
        user={user}
        recurringType
        month={month}
      />
    </div>
  )
}

export default SpendingDashboard;
