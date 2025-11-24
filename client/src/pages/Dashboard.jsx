import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import axios from "axios";
import { ENDPOINTS } from "../config/api";
import { DollarSign, ShoppingBag, Users, Package } from "lucide-react";
import StatsCard from "../components/StatsCard";
import SalesChart from "../components/SalesChart";
import { formatCurrency } from "../utils/currency";

const Dashboard = () => {
  const { user } = useSelector((state) => state.auth);
  const { data: settings } = useSelector((state) => state.settings);
  const [stats, setStats] = useState(null);
  const [chartData, setChartData] = useState([]);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const token = user.token;
      const config = { headers: { Authorization: `Bearer ${token}` } };

      // Fetch stats, chart data, and activities in parallel
      const [statsRes, chartRes, activitiesRes] = await Promise.all([
        axios.get(ENDPOINTS.DASHBOARD_STATS, config),
        axios.get(ENDPOINTS.DASHBOARD_CHART, config),
        axios.get(ENDPOINTS.DASHBOARD_ACTIVITIES, config),
      ]);

      setStats(statsRes.data);
      setChartData(chartRes.data);
      setActivities(activitiesRes.data);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      setLoading(false);
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Dashboard Overview</h1>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Total Sales"
          value={formatCurrency(stats?.totalSales || 0, settings)}
          icon={DollarSign}
          color="text-green-500 bg-green-500"
        />
        <StatsCard
          title="Total Orders"
          value={stats?.totalOrders || 0}
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
        <SalesChart data={chartData} settings={settings} />
        <div className="bg-slate-900 p-6 rounded-lg shadow border border-slate-800">
          <h3 className="text-lg font-bold text-white mb-4">
            Financial Summary
          </h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-slate-800">
              <span className="text-slate-400">Monthly Sales</span>
              <span className="font-semibold text-green-500">
                {formatCurrency(stats?.monthlySales || 0, settings)}
              </span>
            </div>
            <div className="flex justify-between items-center pb-2 border-b border-slate-800">
              <span className="text-slate-400">Monthly Expenses</span>
              <span className="font-semibold text-red-500">
                {formatCurrency(stats?.monthlyExpenses || 0, settings)}
              </span>
            </div>
            <div className="flex justify-between items-center pt-2">
              <span className="text-white font-medium">
                Net Profit (Monthly)
              </span>
              <span
                className={`font-bold text-lg ${
                  (stats?.monthlyNetProfit || 0) >= 0
                    ? "text-green-500"
                    : "text-red-500"
                }`}
              >
                {formatCurrency(stats?.monthlyNetProfit || 0, settings)}
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
                const method = activity.method;
                const url = activity.url || "";
                const userName = activity.user?.name || "System";

                // Determine icon and color based on method
                let activityIcon = Package;
                let activityColor = "bg-slate-500/20 text-slate-400";

                if (method === "POST") {
                  activityIcon = Package;
                  activityColor = "bg-green-500/20 text-green-400";
                } else if (method === "PUT") {
                  activityIcon = Package;
                  activityColor = "bg-blue-500/20 text-blue-400";
                } else if (method === "DELETE") {
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
                        <p className="text-white font-medium text-sm font-mono">
                          {method} {url}
                        </p>
                        <p className="text-slate-400 text-xs mt-0.5">
                          {userName} • {activity.ip || "Unknown IP"}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-slate-400 text-xs">
                        {new Date(activity.createdAt).toLocaleDateString()}
                      </p>
                      <p className="text-slate-500 text-xs">
                        {new Date(activity.createdAt).toLocaleTimeString()}
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
