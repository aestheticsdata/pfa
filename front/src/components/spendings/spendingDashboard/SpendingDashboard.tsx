"use client";

import PeriodSummary from "@components/spendings/spendingDashboard/periodSummary/PeriodSummary";
import GlobalSummary from "@components/spendings/spendingDashboard/globalSummary/GlobalSummary";
import MonthlyChartCard from "@components/spendings/spendingDashboard/monthlyCharts/MonthlyChartCard";
import WeeklyChartCard from "@components/spendings/spendingDashboard/weeklyCharts/WeeklyChartCard";
import FixedExpensesPanel from "@components/spendings/spendingDashboard/fixedExpenses/FixedExpensesPanel";

import type { MonthRange } from "@components/spendings/interfaces/spendingDashboardTypes";

interface SpendingDashboardProps {
  month: MonthRange;
}

const SpendingDashboard = ({ month }: SpendingDashboardProps) => {
  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-4">
          <PeriodSummary />
        </div>
        <div className="lg:col-span-5 flex flex-col gap-6">
          <GlobalSummary />
          <MonthlyChartCard />
        </div>
        <div className="lg:col-span-3 lg:relative">
          <div className="lg:absolute lg:inset-0">
            <FixedExpensesPanel month={month} />
          </div>
        </div>
      </div>

      <WeeklyChartCard />
    </div>
  );
};

export default SpendingDashboard;
