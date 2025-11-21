import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { formatCurrency } from "../utils/currency";

const SalesChart = ({ data, settings }) => {
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900 p-3 border border-slate-800 rounded shadow-lg">
          <p className="text-sm font-medium text-slate-300">
            {payload[0].payload.name}
          </p>
          <p className="text-sm text-blue-400 font-semibold">
            Sales: {formatCurrency(payload[0].value, settings)}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-slate-900 p-6 rounded-lg shadow border border-slate-800">
      <h3 className="text-lg font-bold text-white mb-4">Weekly Sales</h3>
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis dataKey="name" stroke="#94a3b8" />
            <YAxis stroke="#94a3b8" />
            <Tooltip content={<CustomTooltip />} />
            <Line
              type="monotone"
              dataKey="sales"
              stroke="#3b82f6"
              strokeWidth={2}
              dot={{ fill: "#3b82f6", strokeWidth: 2 }}
              activeDot={{ r: 8 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default SalesChart;
