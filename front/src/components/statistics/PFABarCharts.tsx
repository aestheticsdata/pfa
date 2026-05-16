import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  LabelList,
  ResponsiveContainer,
} from "recharts";

import type { StatisticsResponse } from "@src/schemas/stats";

interface PFABarChartsProps {
  data: StatisticsResponse | null;
  year: number;
}

const PFABarCharts = ({ data, year }: PFABarChartsProps) => {
  const currentYearData = data?.data?.[String(year)] ?? [];
  if (currentYearData.length === 0) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-gray-500">
        pas de données
      </div>
    );
  }

  const categoryKeys =
    currentYearData.length > 0
      ? Object.keys(currentYearData[0]).filter((key) => key !== "month")
      : [];

  return (
    <ResponsiveContainer width="100%" height="100%" minHeight={400} minWidth={0}>
      <BarChart data={currentYearData}>
        <CartesianGrid
          strokeDasharray="3 3"
          stroke="rgb(55 65 81 / 0.5)"
        />
        <XAxis dataKey="month" tick={{ fill: "#9ca3af", fontSize: 11 }} />
        <YAxis tick={{ fill: "#9ca3af", fontSize: 11 }} />
        <Tooltip
          labelFormatter={(label: string | number) => `${label} ${year}`}
          formatter={(value: number | string) => `${value} €`}
          offset={7}
          contentStyle={{
            background: "rgba(20, 20, 20, 0.95)",
            border: "1px solid rgba(75, 85, 99, 0.5)",
            borderRadius: "8px",
            fontSize: "0.8rem",
            color: "#e5e7eb",
          }}
          labelStyle={{ color: "#e5e7eb", fontWeight: 600 }}
          itemStyle={{ color: "#e5e7eb" }}
          cursor={{ fill: "rgba(6, 182, 212, 0.08)" }}
          animationDuration={200}
        />
        <Legend wrapperStyle={{ fontSize: "0.75rem", color: "#d1d5db" }} />
        {data?.data &&
          categoryKeys.map((key) => (
            <Bar key={key} dataKey={key} fill={data.colors[key]}>
              <LabelList
                dataKey={key}
                fill="#d1d5db"
                position="top"
                formatter={(label: number | string | boolean | null | undefined) =>
                  Number(label ?? 0) > 0 ? `${label}€` : ""
                }
                fontSize="10px"
              />
            </Bar>
          ))}
      </BarChart>
    </ResponsiveContainer>
  );
};

export default PFABarCharts;
