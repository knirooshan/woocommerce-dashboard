import { useState } from "react";
import { X } from "lucide-react";

const ReasonModal = ({
  isOpen,
  onClose,
  onConfirm,
  title = "Edit Reason",
  message = "Please provide a reason for this change.",
}) => {
  const [reason, setReason] = useState("");

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onConfirm(reason);
    setReason("");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-slate-900 rounded-lg shadow-xl w-full max-w-md border border-slate-800">
        <div className="flex justify-between items-center p-4 border-b border-slate-800">
          <h3 className="text-lg font-medium text-white">{title}</h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4">
          <div className="mb-4">
            <label className="block text-sm font-medium text-slate-300 mb-2">
              {message}
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-md p-2 text-white focus:outline-none focus:ring-1 focus:ring-blue-600"
              rows={3}
              required
              placeholder="Enter reason here..."
            />
          </div>

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800 rounded-md transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md shadow-sm transition-colors"
            >
              Confirm
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReasonModal;
