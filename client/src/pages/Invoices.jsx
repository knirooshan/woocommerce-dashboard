import { useState, useEffect } from "react";
import axios from "axios";
import { Plus, FileText, Eye } from "lucide-react";
import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
import { formatCurrency } from "../utils/currency";

const Invoices = () => {
  const { user } = useSelector((state) => state.auth);
  const [invoices, setInvoices] = useState([]);
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const token = user.token;
      const config = { headers: { Authorization: `Bearer ${token}` } };

      const [invoicesRes, settingsRes] = await Promise.all([
        axios.get("http://localhost:5000/api/invoices", config),
        axios.get("http://localhost:5000/api/settings", config),
      ]);

      setInvoices(invoicesRes.data);
      setSettings(settingsRes.data);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching data:", error);
      setLoading(false);
    }
  };

  if (loading) return <div>Loading invoices...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-white">Invoices</h1>
        <Link
          to="/invoices/create"
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
        >
          <Plus className="mr-2 h-5 w-5" />
          Create Invoice
        </Link>
      </div>

      <div className="bg-slate-900 shadow rounded-lg overflow-hidden border border-slate-800">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-800">
            <thead className="bg-slate-950">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Number
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Due Date
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
              {invoices.map((invoice) => (
                <tr key={invoice._id} className="hover:bg-slate-800/50">
                  <td className="px-6 py-4 whitespace-nowrap font-medium text-blue-400">
                    {invoice.invoiceNumber}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-white">
                    {invoice.customer?.firstName} {invoice.customer?.lastName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-slate-400">
                    {new Date(invoice.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-slate-400">
                    {invoice.dueDate
                      ? new Date(invoice.dueDate).toLocaleDateString()
                      : "-"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap font-medium text-white">
                    {formatCurrency(invoice.total, settings)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        invoice.status === "paid"
                          ? "bg-green-900/50 text-green-400 border border-green-800"
                          : invoice.status === "overdue"
                          ? "bg-red-900/50 text-red-400 border border-red-800"
                          : "bg-yellow-900/50 text-yellow-400 border border-yellow-800"
                      }`}
                    >
                      {invoice.status.charAt(0).toUpperCase() +
                        invoice.status.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <Link
                      to={`/invoices/${invoice._id}`}
                      className="text-blue-400 hover:text-blue-300"
                    >
                      <Eye className="h-5 w-5" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {invoices.length === 0 && (
          <div className="p-6 text-center text-slate-500">
            No invoices found. Create one to get started.
          </div>
        )}
      </div>
    </div>
  );
};

export default Invoices;
