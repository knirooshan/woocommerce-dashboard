import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import axios from "axios";
import { DollarSign, ShoppingBag, Users, Package } from "lucide-react";
import StatsCard from "../components/StatsCard";
import SalesChart from "../components/SalesChart";
import { formatCurrency } from "../utils/currency";

const Dashboard = () => {
  const { user } = useSelector((state) => state.auth);
  const [stats, setStats] = useState(null);
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const token = user.token;
      const config = { headers: { Authorization: `Bearer ${token}` } };

      // Fetch both stats and settings in parallel
      const [statsRes, settingsRes] = await Promise.all([
        axios.get("http://localhost:5000/api/dashboard/stats", config),
        axios.get("http://localhost:5000/api/settings", config),
      ]);

      setStats(statsRes.data);
      setSettings(settingsRes.data);
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
        <h1 className="text-2xl font-bold text-gray-800">Dashboard Overview</h1>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Total Sales"
          value={formatCurrency(stats?.totalSales || 0, settings)}
          icon={DollarSign}
          color="text-green-600 bg-green-600"
        />
        <StatsCard
          title="Total Orders"
          value={stats?.totalOrders || 0}
          icon={ShoppingBag}
          color="text-blue-600 bg-blue-600"
        />
        <StatsCard
          title="Customers"
          value={stats?.totalCustomers || 0}
          icon={Users}
          color="text-purple-600 bg-purple-600"
        />
        <StatsCard
          title="Products"
          value={stats?.totalProducts || 0}
          icon={Package}
          color="text-orange-600 bg-orange-600"
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SalesChart settings={settings} />
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-bold text-gray-800 mb-4">
            Financial Summary
          </h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center pb-2 border-b">
              <span className="text-gray-600">Monthly Sales</span>
              <span className="font-semibold text-green-600">
                {formatCurrency(stats?.monthlySales || 0, settings)}
              </span>
            </div>
            <div className="flex justify-between items-center pb-2 border-b">
              <span className="text-gray-600">Monthly Expenses</span>
              <span className="font-semibold text-red-600">
                {formatCurrency(stats?.monthlyExpenses || 0, settings)}
              </span>
            </div>
            <div className="flex justify-between items-center pt-2">
              <span className="text-gray-800 font-medium">
                Net Profit (Monthly)
              </span>
              <span
                className={`font-bold text-lg ${
                  (stats?.monthlyNetProfit || 0) >= 0
                    ? "text-green-600"
                    : "text-red-600"
                }`}
              >
                {formatCurrency(stats?.monthlyNetProfit || 0, settings)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
