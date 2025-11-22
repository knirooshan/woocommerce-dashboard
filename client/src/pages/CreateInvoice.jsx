import { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate, useLocation } from "react-router-dom";
import { Plus, Trash, Save } from "lucide-react";
import { useSelector } from "react-redux";
import { formatCurrency } from "../utils/currency";

const CreateInvoice = () => {
  const { user } = useSelector((state) => state.auth);
  const navigate = useNavigate();
  const location = useLocation();
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);

  const [formData, setFormData] = useState({
    customer: "",
    items: [],
    notes: "",
    dueDate: "",
    paymentMethod: "Bank Transfer",
    taxRate: 0,
    discount: 0,
    status: "draft",
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = user.token;
        const config = { headers: { Authorization: `Bearer ${token}` } };
        const [custRes, prodRes, settingsRes] = await Promise.all([
          axios.get("http://localhost:5000/api/customers", config),
          axios.get("http://localhost:5000/api/products", config),
          axios.get("http://localhost:5000/api/settings", config),
        ]);
        setCustomers(custRes.data);
        setProducts(prodRes.data);
        setSettings(settingsRes.data);

        // Check for quotation data passed via navigation
        if (location.state?.quotationData) {
          const { customer, items, tax, discount, notes } =
            location.state.quotationData;

          // Calculate tax rate from tax amount if possible, or use default
          // Since we store tax amount, we might need to infer rate or just use default
          // For now, let's use the default tax rate from settings, or 0
          const defaultTaxRate = settingsRes.data?.tax?.rate || 0;

          setFormData((prev) => ({
            ...prev,
            customer: customer._id,
            items: items.map((item) => ({
              product: item.product?._id || "", // Handle case where product might be populated or just ID
              name: item.name,
              price: item.price,
              quantity: item.quantity,
              total: item.total,
            })),
            notes: notes || "",
            taxRate: defaultTaxRate,
            discount: discount || 0,
          }));
        } else {
          setFormData((prev) => ({
            ...prev,
            taxRate: settingsRes.data?.tax?.rate || 0,
          }));
        }

        setLoading(false);
      } catch (error) {
        console.error("Error fetching data:", error);
        setLoading(false);
      }
    };
    fetchData();
  }, [user.token, location.state]);

  const addItem = () => {
    setFormData((prev) => ({
      ...prev,
      items: [
        ...prev.items,
        { product: "", name: "", price: 0, quantity: 1, total: 0 },
      ],
    }));
  };

  const removeItem = (index) => {
    const newItems = formData.items.filter((_, i) => i !== index);
    setFormData((prev) => ({ ...prev, items: newItems }));
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...formData.items];
    newItems[index][field] = value;

    if (field === "product") {
      const selectedProduct = products.find((p) => p._id === value);
      if (selectedProduct) {
        newItems[index].name = selectedProduct.name;
        newItems[index].price = selectedProduct.price;
        newItems[index].sku = selectedProduct.sku;
      }
    }

    newItems[index].total = newItems[index].price * newItems[index].quantity;
    setFormData((prev) => ({ ...prev, items: newItems }));
  };

  const calculateTotals = () => {
    const subtotal = formData.items.reduce((sum, item) => sum + item.total, 0);
    const tax = subtotal * (formData.taxRate / 100);
    const total = subtotal + tax - formData.discount;
    return { subtotal, tax, total };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const totals = calculateTotals();

    try {
      const token = user.token;
      const config = { headers: { Authorization: `Bearer ${token}` } };
      await axios.post(
        "http://localhost:5000/api/invoices",
        {
          ...formData,
          ...totals,
        },
        config
      );
      navigate("/invoices");
    } catch (error) {
      console.error("Error creating invoice:", error);
    }
  };

  const { subtotal, tax, total } = calculateTotals();

  if (loading) return <div>Loading...</div>;

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-white mb-6">Create New Invoice</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Customer Selection */}
        <div className="bg-slate-900 p-6 rounded-lg shadow border border-slate-800">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Select Customer
              </label>
              <select
                value={formData.customer}
                onChange={(e) =>
                  setFormData({ ...formData, customer: e.target.value })
                }
                className="block w-full bg-slate-950 border border-slate-700 text-white rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="">Select a customer...</option>
                {customers.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.firstName} {c.lastName} ({c.email})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Due Date
              </label>
              <input
                type="date"
                value={formData.dueDate}
                onChange={(e) =>
                  setFormData({ ...formData, dueDate: e.target.value })
                }
                className="block w-full bg-slate-950 border border-slate-700 text-white rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Items List */}
        <div className="bg-slate-900 p-6 rounded-lg shadow border border-slate-800">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-medium text-white">Items</h2>
            <button
              type="button"
              onClick={addItem}
              className="flex items-center text-sm text-blue-400 hover:text-blue-300"
            >
              <Plus className="h-4 w-4 mr-1" /> Add Item
            </button>
          </div>

          <div className="space-y-4">
            {formData.items.map((item, index) => (
              <div
                key={index}
                className="flex gap-4 items-end border-b border-slate-800 pb-4"
              >
                <div className="flex-1">
                  <label className="block text-xs font-medium text-slate-400 mb-1">
                    Product
                  </label>
                  <select
                    value={item.product}
                    onChange={(e) =>
                      handleItemChange(index, "product", e.target.value)
                    }
                    className="block w-full bg-slate-950 border border-slate-700 text-white rounded-md py-1.5 px-2 text-sm"
                    required
                  >
                    <option value="">Select Product...</option>
                    {products.map((p) => (
                      <option key={p._id} value={p._id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="w-24">
                  <label className="block text-xs font-medium text-slate-400 mb-1">
                    Price
                  </label>
                  <input
                    type="number"
                    value={item.price}
                    onChange={(e) =>
                      handleItemChange(
                        index,
                        "price",
                        parseFloat(e.target.value)
                      )
                    }
                    className="block w-full bg-slate-950 border border-slate-700 text-white rounded-md py-1.5 px-2 text-sm"
                  />
                </div>
                <div className="w-20">
                  <label className="block text-xs font-medium text-slate-400 mb-1">
                    Qty
                  </label>
                  <input
                    type="number"
                    value={item.quantity}
                    onChange={(e) =>
                      handleItemChange(
                        index,
                        "quantity",
                        parseFloat(e.target.value)
                      )
                    }
                    className="block w-full bg-slate-950 border border-slate-700 text-white rounded-md py-1.5 px-2 text-sm"
                  />
                </div>
                <div className="w-24 text-right pb-2 font-medium">
                  {formatCurrency(item.total, settings)}
                </div>
                <button
                  type="button"
                  onClick={() => removeItem(index)}
                  className="text-red-400 hover:text-red-300 pb-2"
                >
                  <Trash className="h-5 w-5" />
                </button>
              </div>
            ))}
          </div>

          {/* Totals */}
          <div className="mt-6 border-t border-slate-800 pt-4 flex flex-col items-end space-y-2">
            <div className="flex justify-between w-64">
              <span className="text-slate-400">Subtotal:</span>
              <span className="font-medium">
                {formatCurrency(subtotal, settings)}
              </span>
            </div>
            <div className="flex justify-between w-64 items-center">
              <span className="text-slate-400">
                {settings?.tax?.label || "Tax"} Rate (%):
              </span>
              <input
                type="number"
                value={formData.taxRate}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    taxRate: parseFloat(e.target.value),
                  })
                }
                className="w-20 bg-slate-950 border border-slate-700 text-white rounded px-2 py-1 text-right"
              />
            </div>
            <div className="flex justify-between w-64 items-center">
              <span className="text-slate-400">Discount:</span>
              <input
                type="number"
                value={formData.discount}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    discount: parseFloat(e.target.value),
                  })
                }
                className="w-20 bg-slate-950 border border-slate-700 text-white rounded px-2 py-1 text-right"
              />
            </div>
            <div className="flex justify-between w-64 text-lg font-bold pt-2 border-t">
              <span>Total:</span>
              <span>{formatCurrency(total, settings)}</span>
            </div>
          </div>
        </div>

        {/* Additional Info */}
        <div className="bg-slate-900 p-6 rounded-lg shadow border border-slate-800">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Payment Method
              </label>
              <select
                value={formData.paymentMethod}
                onChange={(e) =>
                  setFormData({ ...formData, paymentMethod: e.target.value })
                }
                className="block w-full bg-slate-950 border border-slate-700 text-white rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="Bank Transfer">Bank Transfer</option>
                <option value="Cash">Cash</option>
                <option value="Check">Check</option>
                <option value="Credit Card">Credit Card</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) =>
                  setFormData({ ...formData, status: e.target.value })
                }
                className="block w-full bg-slate-950 border border-slate-700 text-white rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="draft">Draft</option>
                <option value="sent">Sent</option>
                <option value="paid">Paid</option>
              </select>
            </div>
          </div>
          <div className="mt-4">
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Notes
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) =>
                setFormData({ ...formData, notes: e.target.value })
              }
              rows={3}
              className="block w-full bg-slate-950 border border-slate-700 text-white rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            className="flex items-center px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 shadow-sm font-medium"
          >
            <Save className="mr-2 h-5 w-5" />
            Save Invoice
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateInvoice;
