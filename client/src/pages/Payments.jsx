import { useState, useEffect } from "react";
import axios from "axios";
import { useSelector } from "react-redux";
import { formatCurrency } from "../utils/currency";
import { Edit, Trash2, Plus } from "lucide-react";
import PaymentModal from "../components/PaymentModal";
import ReasonModal from "../components/ReasonModal";
import { ENDPOINTS } from "../config/api";

const Payments = () => {
  const { user } = useSelector((state) => state.auth);
  const { data: settings } = useSelector((state) => state.settings);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [showReasonModal, setShowReasonModal] = useState(false);
  const [pendingPaymentData, setPendingPaymentData] = useState(null);

  useEffect(() => {
    fetchData();
  }, [page]);

  const fetchData = async () => {
    try {
      const token = user.token;
      const config = { headers: { Authorization: `Bearer ${token}` } };

      const paymentsRes = await axios.get(
        `${ENDPOINTS.PAYMENTS}?pageNumber=${page}`,
        config
      );

      setPayments(paymentsRes.data.payments);
      setPages(paymentsRes.data.pages);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching data:", error);
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (
      !window.confirm(
        "Are you sure you want to delete this payment? This will revert the invoice balance."
      )
    )
      return;
    try {
      const token = user.token;
      const config = { headers: { Authorization: `Bearer ${token}` } };
      await axios.delete(ENDPOINTS.PAYMENT_BY_ID(id), config);
      fetchData();
    } catch (error) {
      console.error("Error deleting payment:", error);
      alert("Failed to delete payment");
    }
  };

  const handleEdit = (payment) => {
    setSelectedPayment(payment);
    setSelectedInvoice({
      _id: payment.invoice?._id,
      customer: payment.customer,
    });
    setIsPaymentModalOpen(true);
  };

  const handleCreate = () => {
    setSelectedPayment(null);
    setSelectedInvoice({
      _id: null,
      customer: null,
    });
    setIsPaymentModalOpen(true);
  };

  const handlePaymentSave = async (paymentData) => {
    if (selectedPayment) {
      // For edits, show reason modal
      setPendingPaymentData(paymentData);
      setShowReasonModal(true);
    } else {
      // For new payments, save directly
      try {
        const token = user.token;
        const config = { headers: { Authorization: `Bearer ${token}` } };
        await axios.post(ENDPOINTS.PAYMENTS, paymentData, config);
        setIsPaymentModalOpen(false);
        setSelectedPayment(null);
        setSelectedInvoice(null);
        fetchData();
      } catch (error) {
        console.error("Error saving payment:", error);
        alert("Failed to save payment");
      }
    }
  };

  const handleConfirmEdit = async (reason) => {
    try {
      const token = user.token;
      const config = { headers: { Authorization: `Bearer ${token}` } };
      await axios.put(
        ENDPOINTS.PAYMENT_BY_ID(selectedPayment._id),
        {
          ...pendingPaymentData,
          editReason: reason,
          editedBy: user.name,
        },
        config
      );
      setIsPaymentModalOpen(false);
      setShowReasonModal(false);
      setSelectedPayment(null);
      setSelectedInvoice(null);
      setPendingPaymentData(null);
      fetchData();
    } catch (error) {
      console.error("Error updating payment:", error);
      alert("Failed to update payment");
    }
  };

  if (loading) return <div className="text-white">Loading payments...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-white">Payments</h1>
        <button
          onClick={handleCreate}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
        >
          <Plus className="mr-2 h-5 w-5" />
          Create Payment
        </button>
      </div>

      <div className="bg-slate-900 shadow rounded-lg overflow-hidden border border-slate-800">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-800">
            <thead className="bg-slate-950">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Invoice
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Method
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Source
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-slate-900 divide-y divide-slate-800">
              {payments.map((payment) => (
                <tr key={payment._id} className="hover:bg-slate-800/50">
                  <td className="px-6 py-4 whitespace-nowrap text-slate-300">
                    {new Date(payment.date).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-blue-400">
                    {payment.invoice?.invoiceNumber || "-"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-white">
                    {payment.customer?.firstName} {payment.customer?.lastName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-slate-300">
                    {payment.method}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-slate-300">
                    {payment.source}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right font-medium text-white">
                    {formatCurrency(payment.amount, settings)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium flex justify-end gap-2">
                    <button
                      onClick={() => handleEdit(payment)}
                      className="text-blue-400 hover:text-blue-300"
                    >
                      <Edit className="h-5 w-5" />
                    </button>
                    {user?.role === "admin" && (
                      <button
                        onClick={() => handleDelete(payment._id)}
                        className="text-red-400 hover:text-red-300"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {payments.length === 0 && (
          <div className="p-6 text-center text-slate-500">
            No payments found.
          </div>
        )}

        {/* Pagination */}
        {pages > 1 && (
          <div className="px-6 py-4 flex justify-center border-t border-slate-800">
            <nav className="flex gap-2">
              {[...Array(pages).keys()].map((x) => (
                <button
                  key={x + 1}
                  onClick={() => setPage(x + 1)}
                  className={`px-3 py-1 rounded ${
                    page === x + 1
                      ? "bg-blue-600 text-white"
                      : "bg-slate-800 text-slate-400 hover:bg-slate-700"
                  }`}
                >
                  {x + 1}
                </button>
              ))}
            </nav>
          </div>
        )}
      </div>

      {/* Reuse PaymentModal for editing, but we might need to tweak it to pre-fill data */}
      {/* Since PaymentModal is simple, let's just use it. We need to pass initial values though. */}
      {/* The current PaymentModal doesn't accept initial values for editing. We need to update it. */}
      {/* Let's update PaymentModal first to accept initialData */}

      {selectedInvoice && (
        <PaymentModal
          isOpen={isPaymentModalOpen}
          onClose={() => {
            setIsPaymentModalOpen(false);
            setSelectedPayment(null);
            setSelectedInvoice(null);
          }}
          onSave={handlePaymentSave}
          invoice={selectedInvoice}
          totalDue={1000000} // Allow editing to any amount for now
          initialData={selectedPayment}
        />
      )}

      <ReasonModal
        isOpen={showReasonModal}
        onClose={() => {
          setShowReasonModal(false);
          setPendingPaymentData(null);
        }}
        onConfirm={handleConfirmEdit}
        title="Edit Payment Reason"
        message="Please provide a reason for editing this payment."
      />
    </div>
  );
};

export default Payments;
