import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type { StatisticsResponse } from "@src/schemas/stats";

interface PFALineChartsProps {
  data: StatisticsResponse | null;
  year: number;
}

const PFALineCharts = ({ data, year }: PFALineChartsProps) => {
  const lineData = data?.data?.[String(year)] ?? [];
  const colors = data?.colors ?? {};
  const categories = Object.keys(colors).sort();

  if (lineData.length === 0) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-gray-500">
        pas de données
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height="100%" minHeight={400} minWidth={0}>
      <LineChart
        data={lineData}
        margin={{ top: 5, right: 30, left: 0, bottom: 5 }}
      >
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
          cursor={{ stroke: "rgba(6, 182, 212, 0.4)", strokeWidth: 1 }}
          animationDuration={200}
        />
        <Legend wrapperStyle={{ fontSize: "0.75rem", color: "#d1d5db" }} />
        {categories.map((cat) => (
          <Line
            key={cat}
            type="monotone"
            dataKey={cat}
            stroke={colors[cat]}
            strokeWidth={2}
            dot={{ r: 3 }}
            activeDot={{ r: 5 }}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
};

export default PFALineCharts;
