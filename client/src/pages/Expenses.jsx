import { useState, useEffect } from "react";
import axios from "axios";
import { Plus, Trash, DollarSign, Edit } from "lucide-react";
import ReasonModal from "../components/ReasonModal";
import { useSelector } from "react-redux";
import { formatCurrency } from "../utils/currency";

const Expenses = () => {
  const { user } = useSelector((state) => state.auth);
  const [expenses, setExpenses] = useState([]);
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [showReasonModal, setShowReasonModal] = useState(false);
  const [pendingUpdate, setPendingUpdate] = useState(null);
  const [formData, setFormData] = useState({
    description: "",
    amount: "",
    category: "General",
    date: new Date().toISOString().split("T")[0],
    vendor: "",
    reference: "",
    notes: "",
  });

  const [vendors, setVendors] = useState([]);

  useEffect(() => {
    fetchExpenses();
    fetchVendors();
  }, [user.token]);

  const fetchVendors = async () => {
    try {
      const token = user.token;
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const { data } = await axios.get(
        "http://localhost:5000/api/vendors",
        config
      );
      setVendors(data);
    } catch (error) {
      console.error("Error fetching vendors:", error);
    }
  };

  const fetchExpenses = async () => {
    try {
      const token = user.token;
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const [expensesRes, settingsRes] = await Promise.all([
        axios.get("http://localhost:5000/api/expenses", config),
        axios.get("http://localhost:5000/api/settings", config),
      ]);
      setExpenses(expensesRes.data);
      setSettings(settingsRes.data);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching expenses:", error);
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (editingExpense) {
      // For edits, show reason modal
      setPendingUpdate(formData);
      setShowReasonModal(true);
    } else {
      // For new expenses, save directly
      try {
        const token = user.token;
        const config = { headers: { Authorization: `Bearer ${token}` } };
        await axios.post(
          "http://localhost:5000/api/expenses",
          formData,
          config
        );
        setShowForm(false);
        resetForm();
        fetchExpenses();
      } catch (error) {
        console.error("Error creating expense:", error);
      }
    }
  };

  const handleConfirmEdit = async (reason) => {
    try {
      const token = user.token;
      const config = { headers: { Authorization: `Bearer ${token}` } };
      await axios.put(
        `http://localhost:5000/api/expenses/${editingExpense._id}`,
        {
          ...pendingUpdate,
          editReason: reason,
          editedBy: user.name,
        },
        config
      );
      setShowForm(false);
      setShowReasonModal(false);
      setEditingExpense(null);
      setPendingUpdate(null);
      resetForm();
      fetchExpenses();
    } catch (error) {
      console.error("Error updating expense:", error);
    }
  };

  const resetForm = () => {
    setFormData({
      description: "",
      amount: "",
      category: "General",
      date: new Date().toISOString().split("T")[0],
      vendor: "",
      reference: "",
      notes: "",
    });
  };

  const handleEdit = (expense) => {
    setEditingExpense(expense);
    setFormData({
      description: expense.description,
      amount: expense.amount,
      category: expense.category,
      date: expense.date.split("T")[0],
      vendor: expense.vendor?._id || "",
      reference: expense.reference || "",
      notes: expense.notes || "",
    });
    setShowForm(true);
  };

  const handleCancelEdit = () => {
    setShowForm(false);
    setEditingExpense(null);
    resetForm();
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this expense?"))
      return;
    try {
      const token = user.token;
      const config = { headers: { Authorization: `Bearer ${token}` } };
      await axios.delete(`http://localhost:5000/api/expenses/${id}`, config);
      fetchExpenses();
    } catch (error) {
      console.error("Error deleting expense:", error);
    }
  };

  if (loading) return <div>Loading expenses...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-white">Expenses</h1>
        <button
          onClick={() => (showForm ? handleCancelEdit() : setShowForm(true))}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
        >
          <Plus className="mr-2 h-5 w-5" />
          {showForm ? "Cancel" : "Add Expense"}
        </button>
      </div>

      {showForm && (
        <div className="bg-slate-900 p-6 rounded-lg shadow border border-slate-800 mb-6">
          <h2 className="text-lg font-medium text-white mb-4">
            {editingExpense ? "Edit Expense" : "New Expense"}
          </h2>
          <form
            onSubmit={handleSubmit}
            className="grid grid-cols-1 md:grid-cols-2 gap-4"
          >
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">
                Description
              </label>
              <input
                type="text"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                className="w-full bg-slate-950 border border-slate-700 text-white rounded px-3 py-2"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">
                Amount
              </label>
              <input
                type="number"
                value={formData.amount}
                onChange={(e) =>
                  setFormData({ ...formData, amount: e.target.value })
                }
                className="w-full bg-slate-950 border border-slate-700 text-white rounded px-3 py-2"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">
                Category
              </label>
              <select
                value={formData.category}
                onChange={(e) =>
                  setFormData({ ...formData, category: e.target.value })
                }
                className="w-full bg-slate-950 border border-slate-700 text-white rounded px-3 py-2"
              >
                <option value="General">General</option>
                <option value="Rent">Rent</option>
                <option value="Utilities">Utilities</option>
                <option value="Supplies">Supplies</option>
                <option value="Salary">Salary</option>
                <option value="Marketing">Marketing</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">
                Date
              </label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) =>
                  setFormData({ ...formData, date: e.target.value })
                }
                className="w-full bg-slate-950 border border-slate-700 text-white rounded px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">
                Vendor
              </label>
              <select
                value={formData.vendor}
                onChange={(e) =>
                  setFormData({ ...formData, vendor: e.target.value })
                }
                className="w-full bg-slate-950 border border-slate-700 text-white rounded px-3 py-2"
              >
                <option value="">Select Vendor</option>
                {vendors.map((vendor) => (
                  <option key={vendor._id} value={vendor._id}>
                    {vendor.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">
                Reference
              </label>
              <input
                type="text"
                value={formData.reference}
                onChange={(e) =>
                  setFormData({ ...formData, reference: e.target.value })
                }
                className="w-full bg-slate-950 border border-slate-700 text-white rounded px-3 py-2"
              />
            </div>
            <div className="md:col-span-2">
              <button
                type="submit"
                className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700"
              >
                Save Expense
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-slate-900 shadow rounded-lg overflow-hidden border border-slate-800">
        <table className="min-w-full divide-y divide-slate-800">
          <thead className="bg-slate-950">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                Description
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                Category
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                Vendor
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
            {expenses.map((expense) => (
              <tr key={expense._id} className="hover:bg-slate-800/50">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-400">
                  {new Date(expense.date).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">
                  {expense.description}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-400">
                  <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-slate-800 text-slate-400 border border-slate-700">
                    {expense.category}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-400">
                  {expense.vendor?.name || "-"}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-red-600">
                  -{formatCurrency(expense.amount, settings)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium flex justify-end gap-2">
                  <button
                    onClick={() => handleEdit(expense)}
                    className="text-yellow-400 hover:text-yellow-300"
                    title="Edit Expense"
                  >
                    <Edit className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => handleDelete(expense._id)}
                    className="text-red-400 hover:text-red-300"
                    title="Delete Expense"
                  >
                    <Trash className="h-5 w-5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {expenses.length === 0 && (
          <div className="p-6 text-center text-slate-500">
            No expenses recorded.
          </div>
        )}
      </div>

      <ReasonModal
        isOpen={showReasonModal}
        onClose={() => {
          setShowReasonModal(false);
          setPendingUpdate(null);
        }}
        onConfirm={handleConfirmEdit}
        title="Edit Expense Reason"
        message="Please provide a reason for editing this expense."
      />
    </div>
  );
};

export default Expenses;
