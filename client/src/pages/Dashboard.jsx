import { useState, useEffect, useRef } from "react";
import { useSelector } from "react-redux";
import axios from "axios";
import { ENDPOINTS } from "../config/api";
import { DollarSign, ShoppingBag, Users, Package } from "lucide-react";
import StatsCard from "../components/StatsCard";
import SalesChart from "../components/SalesChart";
import { formatCurrency } from "../utils/currency";
import { formatDate, formatTime } from "../utils/date";

const PERIOD_OPTIONS = [
  { label: "7 Days", value: "7d" },
  { label: "Month", value: "month" },
  { label: "Year", value: "year" },
  { label: "All Time", value: "all" },
];

const PERIOD_LABELS = {
  "7d": "Last 7 Days",
  month: "This Month",
  year: "This Year",
  all: "All Time",
};

const Dashboard = () => {
  const { user } = useSelector((state) => state.auth);
  const { data: settings } = useSelector((state) => state.settings);
  const [stats, setStats] = useState(null);
  const [chartData, setChartData] = useState([]);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [period, setPeriod] = useState("month");
  const initialized = useRef(false);

  useEffect(() => {
    fetchDashboardData("month", true);
  }, []);

  useEffect(() => {
    if (initialized.current) {
      fetchDashboardData(period, false);
    }
  }, [period]);

  const fetchDashboardData = async (activePeriod, isInitial) => {
    try {
      const token = user.token;
      const config = { headers: { Authorization: `Bearer ${token}` } };

      if (isInitial) setLoading(true);
      else setRefreshing(true);

      const requests = [
        axios.get(
          `${ENDPOINTS.DASHBOARD_STATS}?period=${activePeriod}`,
          config,
        ),
        axios.get(
          `${ENDPOINTS.DASHBOARD_CHART}?period=${activePeriod}`,
          config,
        ),
      ];
      if (isInitial) {
        requests.push(axios.get(ENDPOINTS.DASHBOARD_ACTIVITIES, config));
      }

      const results = await Promise.all(requests);

      // Normalize stats — handle both new API (periodSales) and legacy API (totalSales/monthlySales)
      const raw = results[0].data;
      let normalizedStats;
      if (raw && "periodSales" in raw) {
        normalizedStats = raw;
      } else if (raw) {
        const isMonth = activePeriod === "month";
        normalizedStats = {
          periodSales: isMonth
            ? (raw.monthlySales ?? 0)
            : (raw.totalSales ?? 0),
          periodOrders: isMonth
            ? (raw.totalOrders ?? 0)
            : (raw.totalOrders ?? 0),
          periodExpenses: isMonth
            ? (raw.monthlyExpenses ?? 0)
            : (raw.totalExpenses ?? 0),
          periodNetProfit: isMonth
            ? (raw.monthlyNetProfit ?? 0)
            : (raw.netProfit ?? 0),
          totalCustomers: raw.totalCustomers ?? 0,
          totalProducts: raw.totalProducts ?? 0,
        };
      }

      setStats(normalizedStats);
      setChartData(results[1].data);
      if (isInitial) setActivities(results[2].data);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
      initialized.current = true;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const periodLabel = PERIOD_LABELS[period];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-white">Dashboard Overview</h1>
        <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 rounded-lg p-1">
          {PERIOD_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setPeriod(opt.value)}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                period === opt.value
                  ? "bg-blue-600 text-white"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {refreshing && (
        <div className="flex items-center gap-2 text-slate-400 text-sm">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
          Updating...
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title={`Sales (${periodLabel})`}
          value={formatCurrency(stats?.periodSales || 0, settings)}
          icon={DollarSign}
          color="text-green-500 bg-green-500"
        />
        <StatsCard
          title={`Orders (${periodLabel})`}
          value={stats?.periodOrders || 0}
          icon={ShoppingBag}
          color="text-blue-500 bg-blue-500"
        />
        <StatsCard
          title="Customers"
          value={stats?.totalCustomers || 0}
          icon={Users}
          color="text-purple-500 bg-purple-500"
        />
        <StatsCard
          title="Products"
          value={stats?.totalProducts || 0}
          icon={Package}
          color="text-orange-500 bg-orange-500"
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SalesChart data={chartData} settings={settings} period={period} />
        <div className="bg-slate-900 p-6 rounded-lg shadow border border-slate-800">
          <h3 className="text-lg font-bold text-white mb-4">
            Financial Summary
          </h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-slate-800">
              <span className="text-slate-400">{periodLabel} Sales</span>
              <span className="font-semibold text-green-500">
                {formatCurrency(stats?.periodSales || 0, settings)}
              </span>
            </div>
            <div className="flex justify-between items-center pb-2 border-b border-slate-800">
              <span className="text-slate-400">{periodLabel} Expenses</span>
              <span className="font-semibold text-red-500">
                {formatCurrency(stats?.periodExpenses || 0, settings)}
              </span>
            </div>
            <div className="flex justify-between items-center pt-2">
              <span className="text-white font-medium">
                Net Profit ({periodLabel})
              </span>
              <span
                className={`font-bold text-lg ${
                  (stats?.periodNetProfit || 0) >= 0
                    ? "text-green-500"
                    : "text-red-500"
                }`}
              >
                {formatCurrency(stats?.periodNetProfit || 0, settings)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activities - Admin Only */}
      {user?.role === "admin" && (
        <div className="bg-slate-900 p-6 rounded-lg shadow border border-slate-800">
          <h3 className="text-lg font-bold text-white mb-4">
            Recent Activities
          </h3>
          <div className="space-y-3">
            {activities.length > 0 ? (
              activities.map((activity, index) => {
                const action = activity.action || "Unknown";
                const collection = activity.collectionName || "Unknown";
                const userName = activity.user?.name || "System";

                // Determine icon and color based on action
                let activityIcon = Package;
                let activityColor = "bg-slate-500/20 text-slate-400";

                if (action === "create") {
                  activityIcon = Package;
                  activityColor = "bg-green-500/20 text-green-400";
                } else if (action === "update") {
                  activityIcon = Package;
                  activityColor = "bg-blue-500/20 text-blue-400";
                } else if (action === "delete") {
                  activityIcon = Package;
                  activityColor = "bg-red-500/20 text-red-400";
                }

                const ActivityIcon = activityIcon;

                return (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-slate-800 rounded-lg hover:bg-slate-750 transition-colors"
                  >
                    <div className="flex items-center space-x-3 flex-1">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center ${activityColor}`}
                      >
                        <ActivityIcon size={20} />
                      </div>
                      <div className="flex-1">
                        <p className="text-white font-medium text-sm font-mono capitalize">
                          {action} {collection}
                        </p>
                        <p className="text-slate-400 text-xs mt-0.5">
                          {userName} • {activity.ip || "Unknown IP"}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-slate-400 text-xs">
                        {formatDate(activity.createdAt, settings)}
                      </p>
                      <p className="text-slate-500 text-xs">
                        {formatTime(activity.createdAt, settings)}
                      </p>
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-slate-400 text-center py-4">
                No recent activities
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
