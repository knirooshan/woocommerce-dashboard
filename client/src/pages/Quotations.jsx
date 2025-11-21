import { useState, useEffect } from "react";
import axios from "axios";
import { Plus, FileText, Eye } from "lucide-react";
import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
import { formatCurrency } from "../utils/currency";

const Quotations = () => {
  const { user } = useSelector((state) => state.auth);
  const [quotations, setQuotations] = useState([]);
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const token = user.token;
      const config = { headers: { Authorization: `Bearer ${token}` } };

      const [quotationsRes, settingsRes] = await Promise.all([
        axios.get("http://localhost:5000/api/quotations", config),
        axios.get("http://localhost:5000/api/settings", config),
      ]);

      setQuotations(quotationsRes.data);
      setSettings(settingsRes.data);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching data:", error);
      setLoading(false);
    }
  };

  if (loading) return <div>Loading quotations...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-white">Quotations</h1>
        <Link
          to="/quotations/create"
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
        >
          <Plus className="mr-2 h-5 w-5" />
          Create Quotation
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
              {quotations.map((quotation) => (
                <tr key={quotation._id} className="hover:bg-slate-800/50">
                  <td className="px-6 py-4 whitespace-nowrap font-medium text-blue-400">
                    {quotation.quotationNumber}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-white">
                    {quotation.customer?.firstName}{" "}
                    {quotation.customer?.lastName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-slate-400">
                    {new Date(quotation.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap font-medium text-white">
                    {formatCurrency(quotation.total, settings)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        quotation.status === "sent"
                          ? "bg-blue-900/50 text-blue-400 border border-blue-800"
                          : quotation.status === "accepted"
                          ? "bg-green-900/50 text-green-400 border border-green-800"
                          : "bg-slate-800 text-slate-400 border border-slate-700"
                      }`}
                    >
                      {quotation.status.charAt(0).toUpperCase() +
                        quotation.status.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <Link
                      to={`/quotations/${quotation._id}`}
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
        {quotations.length === 0 && (
          <div className="p-6 text-center text-slate-500">
            No quotations found. Create one to get started.
          </div>
        )}
      </div>
    </div>
  );
};

export default Quotations;
