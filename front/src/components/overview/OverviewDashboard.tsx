"use client";

import MonthSelector from "@components/overview/MonthSelector";
import InsightsRibbon from "@components/overview/sections/InsightsRibbon";
import ForecastStrip from "@components/overview/sections/ForecastStrip";
import BudgetHero from "@components/overview/sections/BudgetHero";
import DailySparkline from "@components/overview/sections/DailySparkline";
import WeeklyCeiling from "@components/overview/sections/WeeklyCeiling";
import CategoryBreakdown from "@components/overview/sections/CategoryBreakdown";
import FixedExpenses from "@components/overview/sections/FixedExpenses";

import type { MonthRange } from "@components/spendings/interfaces/spendingDashboardTypes";

const OverviewDashboard = ({ month }: { month: MonthRange }) => (
  <div className="flex flex-col gap-4">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <h1 className="text-lg font-semibold tracking-[-0.01em] text-ink">
        Dashboard
      </h1>
      <MonthSelector />
    </div>

    <InsightsRibbon />
    <ForecastStrip />

    <div className="grid grid-cols-1 gap-4 min-[1000px]:grid-cols-[2fr_1fr]">
      <div className="flex flex-col gap-4">
        <BudgetHero />
        <DailySparkline />
      </div>
      <WeeklyCeiling />
    </div>

    <div className="grid grid-cols-1 gap-4 min-[1000px]:grid-cols-[2fr_1fr]">
      <CategoryBreakdown />
      <FixedExpenses month={month} />
    </div>
  </div>
);

export default OverviewDashboard;
