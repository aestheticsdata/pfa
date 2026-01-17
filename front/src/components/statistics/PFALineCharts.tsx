import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";

const PFALineCharts = ({ data, year }) => {
  const lineData = data?.data?.[year] ?? 0;
  const colors = data?.colors ?? {};
  const categories = Object.keys(colors).sort();

  if (!lineData) {
    return <div className="text-center text-sm text-gray-500">pas de données.</div>;
  }
  
  return (
    <ResponsiveContainer width="100%" height="100%" minHeight={400} minWidth={0}>
      <LineChart data={lineData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="month" />
        <YAxis />
        <Tooltip
          labelFormatter={label => `${label} ${year}`}
          labelClassName="bg-gray-200 p-1 rounded-sm font-semibold"
          formatter={(value: number) => `${value} €`}
          offset={7}
          contentStyle={{
            fontSize: "0.8rem",
            borderRadius: "5px",
          }}
          animationDuration={200}
        />
        <Legend />
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