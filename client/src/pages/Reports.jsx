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
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1e293b",
                    border: "1px solid #475569",
                    borderRadius: "0.5rem",
                    color: "#fff",
                  }}
                />
                <Legend />
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
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1e293b",
                    border: "1px solid #475569",
                    borderRadius: "0.5rem",
                    color: "#fff",
                  }}
                />
                <Legend />
                <Bar dataKey="profit" fill="#10B981" name="Net Profit" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;
