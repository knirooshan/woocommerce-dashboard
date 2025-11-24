import { useState, useEffect } from "react";
import axios from "axios";
import { ENDPOINTS } from "../config/api";
import { Plus, FileText, Eye, DollarSign, Trash2, Edit } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { formatCurrency } from "../utils/currency";
import PaymentModal from "../components/PaymentModal";

const Invoices = () => {
  const { user } = useSelector((state) => state.auth);
  const { data: settings } = useSelector((state) => state.settings);
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const token = user.token;
      const config = { headers: { Authorization: `Bearer ${token}` } };

      const invoicesRes = await axios.get(ENDPOINTS.INVOICES, config);

      setInvoices(invoicesRes.data);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching data:", error);
      setLoading(false);
    }
  };

  const handleRecordPayment = (invoice) => {
    setSelectedInvoice(invoice);
    setIsPaymentModalOpen(true);
  };

  const handlePaymentSave = async (paymentData) => {
    try {
      const token = user.token;
      const config = { headers: { Authorization: `Bearer ${token}` } };
      await axios.post(ENDPOINTS.PAYMENTS, paymentData, config);
      setIsPaymentModalOpen(false);
      setSelectedInvoice(null);
      fetchData(); // Refresh data to show updated status
    } catch (error) {
      console.error("Error saving payment:", error);
      alert("Failed to save payment");
    }
  };

  const handleDelete = async (invoiceId) => {
    if (
      !window.confirm(
        "Are you sure you want to delete this invoice? This will also delete all associated payment records."
      )
    ) {
      return;
    }
    try {
      const token = user.token;
      const config = { headers: { Authorization: `Bearer ${token}` } };
      await axios.delete(ENDPOINTS.INVOICE_BY_ID(invoiceId), config);
      fetchData(); // Refresh data
      alert("Invoice deleted successfully");
    } catch (error) {
      console.error("Error deleting invoice:", error);
      alert("Failed to delete invoice");
    }
  };

  if (loading) return <div className="text-white">Loading invoices...</div>;

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
                    {invoice.invoiceDate
                      ? new Date(invoice.invoiceDate).toLocaleDateString()
                      : new Date(invoice.createdAt).toLocaleDateString()}
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
                      {invoice.status
                        .replace("_", " ")
                        .charAt(0)
                        .toUpperCase() +
                        invoice.status.replace("_", " ").slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium flex justify-end gap-2">
                    <button
                      onClick={() => navigate(`/invoices/edit/${invoice._id}`)}
                      className="text-yellow-400 hover:text-yellow-300"
                      title="Edit Invoice"
                    >
                      <Edit className="h-5 w-5" />
                    </button>
                    {invoice.status !== "paid" &&
                      invoice.status !== "written-off" && (
                        <button
                          onClick={() => handleRecordPayment(invoice)}
                          className="text-green-400 hover:text-green-300"
                          title="Record Payment"
                        >
                          <DollarSign className="h-5 w-5" />
                        </button>
                      )}
                    {user?.role === "admin" && (
                      <button
                        onClick={() => handleDelete(invoice._id)}
                        className="text-red-400 hover:text-red-300"
                        title="Delete Invoice"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    )}
                    <Link
                      to={`/invoices/${invoice._id}`}
                      className="text-blue-400 hover:text-blue-300"
                      title="View Invoice"
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

      {selectedInvoice && (
        <PaymentModal
          isOpen={isPaymentModalOpen}
          onClose={() => {
            setIsPaymentModalOpen(false);
            setSelectedInvoice(null);
          }}
          onSave={handlePaymentSave}
          invoice={selectedInvoice}
          totalDue={
            selectedInvoice.balanceDue !== undefined
              ? selectedInvoice.balanceDue
              : selectedInvoice.total - (selectedInvoice.amountPaid || 0)
          }
        />
      )}
    </div>
  );
};

export default Invoices;
