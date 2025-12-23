import { useState, useEffect } from "react";
import axios from "axios";
import { ENDPOINTS } from "../config/api";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { useSelector } from "react-redux";
import { formatCurrency } from "../utils/currency";

const Reports = () => {
  const { user } = useSelector((state) => state.auth);
  const { data: settings } = useSelector((state) => state.settings);
  const [stats, setStats] = useState(null);
  const [salesData, setSalesData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = user.token;
        const config = { headers: { Authorization: `Bearer ${token}` } };
        const [salesRes, statsRes] = await Promise.all([
          axios.get(ENDPOINTS.REPORTS_SALES, config),
          axios.get(ENDPOINTS.DASHBOARD_STATS, config),
        ]);
        setStats(statsRes.data);

        // Format sales data for chart
        // The backend now returns merged data with sales, expenses, and profit
        setSalesData(salesRes.data);

        setLoading(false);
      } catch (error) {
        console.error("Error fetching reports:", error);
        setLoading(false);
      }
    };
    fetchData();
  }, [user.token]);

  if (loading) return <div className="text-white">Loading reports...</div>;

  const CustomLegend = ({ payload }) => {
    if (!payload) return null;
    return (
      <div className="flex justify-center gap-6 mt-4">
        {payload.map((entry, index) => (
          <div key={`item-${index}`} className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-sm"
              style={{ backgroundColor: entry.color }}
            ></div>
            <span className="text-slate-400 text-sm">{entry.value}</span>
          </div>
        ))}
      </div>
    );
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900 border border-slate-800 p-3 rounded-lg shadow-xl">
          <p className="text-slate-400 text-xs mb-2 font-medium uppercase tracking-wider">
            {label}
          </p>
          <div className="space-y-1">
            {payload.map((entry, index) => {
              const isProfit = entry.dataKey === "profit";
              const value = entry.value;
              const color = isProfit
                ? value >= 0
                  ? "#10B981"
                  : "#EF4444"
                : entry.color;

              return (
                <div
                  key={index}
                  className="flex items-center justify-between gap-8"
                >
                  <span className="text-slate-400 text-sm">{entry.name}:</span>
                  <span className="font-bold text-sm" style={{ color }}>
                    {formatCurrency(value, settings)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">Reports</h1>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-900 p-6 rounded-lg shadow border border-slate-800">
          <h3 className="text-slate-400 text-sm font-medium">Total Sales</h3>
          <p className="text-3xl font-bold text-white">
            {formatCurrency(stats.totalSales, settings)}
          </p>
        </div>
        <div className="bg-slate-900 p-6 rounded-lg shadow border border-slate-800">
          <h3 className="text-slate-400 text-sm font-medium">Total Expenses</h3>
          <p className="text-3xl font-bold text-red-400">
            {formatCurrency(stats.totalExpenses, settings)}
          </p>
        </div>
        <div className="bg-slate-900 p-6 rounded-lg shadow border border-slate-800">
          <h3 className="text-slate-400 text-sm font-medium">Net Profit</h3>
          <p
            className={`text-3xl font-bold ${
              stats.netProfit >= 0 ? "text-green-400" : "text-red-400"
            }`}
          >
            {formatCurrency(stats.netProfit, settings)}
          </p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales vs Expenses Chart */}
        <div className="bg-slate-900 p-6 rounded-lg shadow border border-slate-800">
          <h2 className="text-lg font-medium text-white mb-4">
            Monthly Sales vs Expenses
          </h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={salesData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
                <XAxis dataKey="name" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip content={<CustomTooltip />} />
                <Legend content={<CustomLegend />} />
                <Bar dataKey="sales" fill="#4F46E5" name="Sales" />
                <Bar dataKey="expenses" fill="#EF4444" name="Expenses" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Net Profit Chart */}
        <div className="bg-slate-900 p-6 rounded-lg shadow border border-slate-800">
          <h2 className="text-lg font-medium text-white mb-4">
            Monthly Net Profit
          </h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={salesData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
                <XAxis dataKey="name" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  content={() => (
                    <CustomLegend
                      payload={[
                        { value: "Profit", color: "#10B981" },
                        { value: "Loss", color: "#EF4444" },
                      ]}
                    />
                  )}
                />
                <Bar dataKey="profit" fill="#10B981">
                  {salesData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.profit >= 0 ? "#10B981" : "#EF4444"}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;
