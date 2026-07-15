import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { useSelector } from "react-redux";
import axios from "axios";
import toast from "react-hot-toast";
import { ENDPOINTS } from "../config/api";

const DeliveryUpdateModal = ({
  isOpen,
  onClose,
  invoiceNumber,
  onSaveSuccess,
}) => {
  const { user } = useSelector((state) => state.auth);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [invoiceId, setInvoiceId] = useState(null);
  const [formData, setFormData] = useState({
    status: "pending",
    trackingNumbers: "",
    note: "",
  });

  useEffect(() => {
    if (isOpen && invoiceNumber) {
      fetchDeliveryDetails();
    }
  }, [isOpen, invoiceNumber]);

  const fetchDeliveryDetails = async () => {
    try {
      setLoading(true);
      const token = user.token;
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const res = await axios.get(
        ENDPOINTS.DELIVERY_SEARCH(invoiceNumber),
        config,
      );

      const delivery = res.data;
      setInvoiceId(delivery.invoice._id);

      setFormData({
        status: delivery.status || "pending",
        trackingNumbers: delivery.trackingNumbers?.join(", ") || "",
        note: "",
      });
    } catch (error) {
      console.error("Error fetching delivery details:", error);
      toast.error("Failed to load delivery details");
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!invoiceId) return;

    try {
      setSaving(true);
      const token = user.token;
      const config = { headers: { Authorization: `Bearer ${token}` } };

      const payload = {
        status: formData.status,
        trackingNumbers: formData.trackingNumbers
          .split(",")
          .map((t) => t.trim())
          .filter((t) => t),
        note: formData.note,
        updatedBy: user.name,
      };

      await axios.put(ENDPOINTS.DELIVERY_UPDATE(invoiceId), payload, config);

      toast.success("Delivery status updated successfully");
      if (onSaveSuccess) onSaveSuccess();
      onClose();
    } catch (error) {
      console.error("Error updating delivery:", error);
      toast.error("Failed to update delivery");
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-slate-900 rounded-lg shadow-xl w-full max-w-md border border-slate-700">
        <div className="flex justify-between items-center p-4 border-b border-slate-700">
          <h2 className="text-xl font-semibold text-white">
            Update Delivery: {invoiceNumber}
          </h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {loading ? (
            <div className="text-slate-400 text-center py-8">
              Loading details...
            </div>
          ) : (
            <>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  Status
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="w-full bg-slate-950 border border-slate-600 rounded px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="pending">Pending</option>
                  <option value="preparing">Preparing</option>
                  <option value="dispatched">Dispatched</option>
                  <option value="delivered">Delivered</option>
                  <option value="picked_up">Customer Picked Up</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  Tracking Numbers (comma separated)
                </label>
                <input
                  type="text"
                  name="trackingNumbers"
                  value={formData.trackingNumbers}
                  onChange={handleChange}
                  placeholder="TRK123, TRK456"
                  className="w-full bg-slate-950 border border-slate-600 rounded px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  Note (Optional)
                </label>
                <textarea
                  name="note"
                  value={formData.note}
                  onChange={handleChange}
                  rows="3"
                  placeholder="e.g. Left at front door"
                  className="w-full bg-slate-950 border border-slate-600 rounded px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                ></textarea>
              </div>

              <div className="flex justify-end pt-4 gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 border border-slate-600 rounded text-slate-300 hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {saving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </>
          )}
        </form>
      </div>
    </div>
  );
};

export default DeliveryUpdateModal;
