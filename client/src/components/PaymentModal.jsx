import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { useSelector } from "react-redux";
import { formatCurrency } from "../utils/currency";

const PaymentModal = ({
  isOpen,
  onClose,
  onSave,
  invoice,
  totalDue,
  initialData,
}) => {
  const { data: settings } = useSelector((state) => state.settings);
  const [formData, setFormData] = useState({
    amount: initialData?.amount || totalDue || "",
    date: initialData?.date
      ? initialData.date.split("T")[0]
      : new Date().toISOString().split("T")[0],
    method: initialData?.method || "Cash",
    reference: initialData?.reference || "",
    notes: initialData?.notes || "",
  });

  useEffect(() => {
    if (isOpen) {
      setFormData({
        amount: initialData?.amount || totalDue || "",
        date: initialData?.date
          ? initialData.date.split("T")[0]
          : new Date().toISOString().split("T")[0],
        method: initialData?.method || "Cash",
        reference: initialData?.reference || "",
        notes: initialData?.notes || "",
      });
    }
  }, [isOpen, initialData, totalDue]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      ...formData,
      amount: parseFloat(formData.amount),
      invoiceId: invoice._id,
      customerId: invoice.customer?._id,
      source: initialData?.source || "Manual",
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-slate-900 rounded-lg shadow-xl w-full max-w-md border border-slate-700">
        <div className="flex justify-between items-center p-4 border-b border-slate-700">
          <h2 className="text-xl font-semibold text-white">
            {initialData ? "Edit Payment" : "Record Payment"}
          </h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              Amount{" "}
              {initialData
                ? ""
                : `(Due: ${formatCurrency(totalDue, settings)})`}
            </label>
            <input
              type="number"
              name="amount"
              step="0.01"
              required
              max={initialData ? undefined : totalDue}
              value={formData.amount}
              onChange={handleChange}
              className="w-full bg-slate-950 border border-slate-600 rounded px-3 py-2 text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              Date
            </label>
            <input
              type="date"
              name="date"
              required
              value={formData.date}
              onChange={handleChange}
              className="w-full bg-slate-950 border border-slate-600 rounded px-3 py-2 text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              Payment Method
            </label>
            <select
              name="method"
              value={formData.method}
              onChange={handleChange}
              className="w-full bg-slate-950 border border-slate-600 rounded px-3 py-2 text-white focus:outline-none focus:border-blue-500"
            >
              <option value="Cash">Cash</option>
              <option value="Card">Card</option>
              <option value="Bank Transfer">Bank Transfer</option>
              <option value="Check">Check</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              Reference (Optional)
            </label>
            <input
              type="text"
              name="reference"
              value={formData.reference}
              onChange={handleChange}
              placeholder="Transaction ID, Check No, etc."
              className="w-full bg-slate-950 border border-slate-600 rounded px-3 py-2 text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              Notes (Optional)
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows="3"
              className="w-full bg-slate-950 border border-slate-600 rounded px-3 py-2 text-white focus:outline-none focus:border-blue-500"
            ></textarea>
          </div>

          <div className="flex justify-end pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 mr-2 text-slate-300 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
            >
              Save Payment
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PaymentModal;
