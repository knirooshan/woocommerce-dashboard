import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import axios from "axios";
import { Eye, ExternalLink } from "lucide-react";
import { formatCurrency } from "../utils/currency";

const Orders = () => {
  const { user } = useSelector((state) => state.auth);
  const [orders, setOrders] = useState([]);
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const token = user.token;
      const config = { headers: { Authorization: `Bearer ${token}` } };

      const [ordersRes, settingsRes] = await Promise.all([
        axios.get("http://localhost:5000/api/orders", config),
        axios.get("http://localhost:5000/api/settings", config),
      ]);

      setOrders(ordersRes.data);
      setSettings(settingsRes.data);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching data:", error);
      setLoading(false);
    }
  };

  const handleSync = async () => {
    if (
      !window.confirm("Sync orders from WooCommerce? This may take a moment.")
    ) {
      return;
    }

    setSyncing(true);
    try {
      const token = user.token;
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const { data } = await axios.post(
        "http://localhost:5000/api/orders/sync",
        {},
        config
      );
      alert(`Successfully synced ${data.orders.length} orders!`);
      fetchData(); // Refresh the orders list
    } catch (error) {
      console.error("Error syncing orders:", error);
      alert(
        error.response?.data?.message ||
          "Failed to sync orders. Please check your WooCommerce settings."
      );
    } finally {
      setSyncing(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "completed":
      case "paid":
        return "bg-green-900/50 text-green-400 border border-green-800";
      case "processing":
        return "bg-blue-900/50 text-blue-400 border border-blue-800";
      case "pending":
      case "on-hold":
        return "bg-yellow-900/50 text-yellow-400 border border-yellow-800";
      case "cancelled":
      case "refunded":
      case "failed":
      case "overdue":
        return "bg-red-900/50 text-red-400 border border-red-800";
      default:
        return "bg-slate-800 text-slate-400 border border-slate-700";
    }
  };

  if (loading) return <div>Loading orders...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-white">Orders</h1>
        <div className="flex gap-3 items-center">
          <div className="text-sm text-slate-400">
            {orders.length} total orders
          </div>
          <button
            onClick={handleSync}
            disabled={syncing}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {syncing ? "Syncing..." : "Sync from WooCommerce"}
          </button>
        </div>
      </div>

      <div className="bg-slate-900 shadow rounded-lg overflow-hidden border border-slate-800">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-800">
            <thead className="bg-slate-950">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Order #
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Total
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-slate-900 divide-y divide-slate-800">
              {orders.map((order) => (
                <tr key={order._id} className="hover:bg-slate-800/50">
                  <td className="px-6 py-4 whitespace-nowrap font-medium text-blue-400">
                    {order.orderNumber}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-white">
                      {order.customerInfo?.firstName ||
                        order.customer?.firstName}{" "}
                      {order.customerInfo?.lastName || order.customer?.lastName}
                    </div>
                    <div className="text-sm text-slate-400">
                      {order.customerInfo?.email || order.customer?.email}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-slate-400">
                    {new Date(
                      order.dateCreated || order.createdAt
                    ).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap font-medium text-white">
                    {formatCurrency(order.total, settings)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(
                        order.status
                      )}`}
                    >
                      {order.status.charAt(0).toUpperCase() +
                        order.status.slice(1).replace("-", " ")}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    {order.invoice ? (
                      <a
                        href={`/invoices/${order.invoice}`}
                        className="text-blue-400 hover:text-blue-300 inline-flex items-center"
                      >
                        <Eye className="h-5 w-5 mr-1" />
                        View Invoice
                      </a>
                    ) : (
                      <span className="text-slate-500 text-xs">No invoice</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {orders.length === 0 && (
          <div className="p-6 text-center text-slate-500">No orders found.</div>
        )}
      </div>

      <div className="bg-blue-900/20 border border-blue-800 rounded-lg p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <ExternalLink className="h-5 w-5 text-blue-400" />
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-400">
              WooCommerce Orders
            </h3>
            <div className="mt-2 text-sm text-slate-400">
              <p>
                This page displays orders synced from your WooCommerce store.
                Click "Sync from WooCommerce" to fetch the latest orders. Make
                sure your WooCommerce credentials are configured in the server
                settings.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Orders;
