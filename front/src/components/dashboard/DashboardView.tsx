"use client";

import BudgetHero from "@components/dashboard/sections/BudgetHero";
import CategoryBreakdown from "@components/dashboard/sections/CategoryBreakdown";
import FixedExpenses from "@components/dashboard/sections/FixedExpenses";
import ForecastStrip from "@components/dashboard/sections/ForecastStrip";
import InsightsRibbon from "@components/dashboard/sections/InsightsRibbon";
import WeeklyCeiling from "@components/dashboard/sections/WeeklyCeiling";

import type { MonthRange } from "@components/spendings/interfaces/spendingDashboardTypes";

// Layout mirrors design_handoff_pfa/designs/Dashboard 2026.html: the month
// selector lives in the app header (NavBar), so no page title here. Two 8fr/4fr
// rows; the daily sparkline is nested inside the BudgetHero card.
const DashboardView = ({ month }: { month: MonthRange }) => (
  <div className="flex flex-col gap-4">
    <InsightsRibbon />
    <ForecastStrip />

    <div className="grid grid-cols-1 gap-4 min-[1000px]:grid-cols-[minmax(0,8fr)_minmax(0,4fr)]">
      <BudgetHero />
      <WeeklyCeiling />
    </div>

    <div className="grid grid-cols-1 gap-4 min-[1000px]:grid-cols-[minmax(0,8fr)_minmax(0,4fr)]">
      <CategoryBreakdown />
      <FixedExpenses month={month} />
    </div>
  </div>
);

export default DashboardView;
