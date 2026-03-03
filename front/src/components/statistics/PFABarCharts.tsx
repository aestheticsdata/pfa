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
} from 'recharts';

import type { StatisticsResponse } from "@src/schemas/stats";

interface PFABarChartsProps {
  data: StatisticsResponse | null;
  year: number;
}

const PFABarCharts = ({ data, year }: PFABarChartsProps) => {
  const currentYearData = data?.data?.[String(year)] ?? [];
  if (currentYearData.length === 0) {
    return <div className="text-center text-sm text-gray-500">pas de données.</div>;
  }

  const categoryKeys = currentYearData.length > 0 ? Object.keys(currentYearData[0]).filter(key => key !== 'month') : [];

  return (
    <ResponsiveContainer width="100%" height="100%" minHeight={400} minWidth={0}>
      <BarChart data={currentYearData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="month" />
        <YAxis />
        <Tooltip
          labelFormatter={(label: string | number) => `${label} ${year}`}
          labelClassName="bg-gray-200 p-1 rounded-sm font-semibold"
          formatter={(value: number | string) => `${value} €`}
          offset={7}
          contentStyle={{
            fontSize: "0.8rem",
            borderRadius: "5px",
          }}
          animationDuration={200}
        />
        <Legend />
        {data?.data && categoryKeys.map((key) => {
          return (
            <Bar
              key={key}
              dataKey={key}
              fill={data.colors[key]}
            >
              <LabelList
                dataKey={key}
                fill="#111"
                position="top"
                formatter={(label: number | string | boolean | null | undefined) => Number(label ?? 0) > 0 ? `${label}€` : ""}
                fontSize="10px"
              />
            </Bar>
          )
        })}
      </BarChart>
    </ResponsiveContainer>
  );
};

export default PFABarCharts;
