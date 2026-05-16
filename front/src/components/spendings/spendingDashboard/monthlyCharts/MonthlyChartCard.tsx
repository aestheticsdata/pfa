"use client";

import format from "date-fns/format";
import fr from "date-fns/locale/fr";
import getYear from "date-fns/getYear";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from "recharts";
import useDatePickerWrapperStore from "@components/datePickerWrapper/store";
import useDashboard from "@components/spendings/services/useDashboard";
import Charts from "@components/spendings/spendingDashboard/charts/Charts";
import { SurfaceCard } from "@components/ui/surface-card";
import { MONTHLY } from "@components/spendings/spendingDashboard/common/widgetHeaderConstants";

const MonthlyChartCard = () => {
  const { to } = useDatePickerWrapperStore();
  const {
    get: { data: dashboard },
    monthlyTotal,
    remaining,
  } = useDashboard();

  if (!to) return null;

  const initial = Number(dashboard?.initialAmount ?? 0);
  const remainingDisplay = Math.max(0, remaining);

  const initialVsRemaining = [
    {
      name: "Montant initial",
      value: initial,
      fill: "#06b6d4",
    },
    {
      name: "Restant",
      value: remainingDisplay,
      fill: "#8b5cf6",
    },
  ];

  const yMax = Math.max(initial, monthlyTotal, 100);

  return (
    <SurfaceCard padding="lg" className="flex flex-col gap-4 flex-1">
      <div>
        <div className="text-gray-100 text-3xl font-semibold capitalize">
          {format(to, "MMMM", { locale: fr })}
        </div>
        <div className="text-gray-500 text-sm">{getYear(to)}</div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1">
        <div className="flex flex-col gap-2 min-w-0">
          <div className="text-gray-300 text-base">Montant initial</div>
          <div className="flex-1 min-h-[220px] -ml-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={initialVsRemaining}
                margin={{ top: 4, right: 4, left: 0, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="rgb(55 65 81 / 0.4)"
                  horizontal
                  vertical={false}
                />
                <XAxis
                  dataKey="name"
                  tick={{ fill: "#9ca3af", fontSize: 12 }}
                  axisLine={{ stroke: "rgb(55 65 81 / 0.5)" }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: "#9ca3af", fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                  domain={[0, Math.ceil(yMax / 900) * 900]}
                />
                <Bar
                  dataKey="value"
                  radius={[6, 6, 0, 0]}
                  isAnimationActive={false}
                >
                  {initialVsRemaining.map((entry) => (
                    <Cell key={entry.name} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="flex flex-col gap-3 min-w-0">
          <div className="text-gray-300 text-base">Répartition mensuelle</div>
          <Charts periodType={MONTHLY} />
        </div>
      </div>
    </SurfaceCard>
  );
};

export default MonthlyChartCard;
