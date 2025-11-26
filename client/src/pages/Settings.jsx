import { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { ENDPOINTS } from "../config/api";
import axios from "axios";
import { Save } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { fetchSettings } from "../store/slices/settingsSlice";

import MediaLibraryModal from "../components/MediaLibraryModal";

import { toast } from "react-hot-toast";

const Settings = () => {
  const { user } = useSelector((state) => state.auth);
  const { data: settings, loading: settingsLoading } = useSelector(
    (state) => state.settings
  );
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [showMediaLibrary, setShowMediaLibrary] = useState(false);

  const [formData, setFormData] = useState({
    storeName: "",
    website: "",
    logo: "",
    address: { street: "", city: "", zip: "", country: "" },
    contact: { phone: "", email: "" },
    smtp: { host: "", port: 587, user: "", pass: "", secure: false },
    bank: { accountName: "", accountNumber: "", bankName: "", branch: "" },
    currency: { code: "USD", symbol: "$", position: "before" },
    tax: { rate: 0, label: "Tax" },
  });

  useEffect(() => {
    if (user && user.role !== "admin") {
      toast.error("Unauthorized access");
      navigate("/");
    }
  }, [user, navigate]);

  useEffect(() => {
    if (settings) {
      setFormData(settings);
    }
  }, [settings]);

  const handleChange = (e, section = null) => {
    const { name, value, type, checked } = e.target;
    const val = type === "checkbox" ? checked : value;

    if (section) {
      setFormData((prev) => ({
        ...prev,
        [section]: { ...prev[section], [name]: val },
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: val }));
    }
  };

  const handleLogoSelect = (media) => {
    setFormData((prev) => ({ ...prev, logo: media.url }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage("");

    try {
      const token = user.token;
      const config = { headers: { Authorization: `Bearer ${token}` } };
      await axios.put(ENDPOINTS.SETTINGS, formData, config);
      setMessage("Settings saved successfully!");
      dispatch(fetchSettings()); // Refresh settings in Redux
      setTimeout(() => setMessage(""), 3000);
    } catch (error) {
      setMessage("Error saving settings");
    } finally {
      setSaving(false);
    }
  };

  if (settingsLoading && !settings)
    return <div className="text-white">Loading settings...</div>;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-white">Store Settings</h1>
        <div className="flex items-center gap-4">
          {user?.role === "admin" && (
            <Link
              to="/activity-log"
              className="px-4 py-2 bg-slate-800 text-white rounded hover:bg-slate-700 transition-colors text-sm font-medium"
            >
              View Activity Log
            </Link>
          )}
          {message && (
            <span
              className={`px-4 py-2 rounded text-sm ${
                message.includes("Error")
                  ? "bg-red-900/50 text-red-200 border border-red-800"
                  : "bg-green-900/50 text-green-200 border border-green-800"
              }`}
            >
              {message}
            </span>
          )}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* General Info */}
        <div className="bg-slate-900 shadow rounded-lg p-6 border border-slate-800">
          <h2 className="text-lg font-medium text-white mb-4 border-b border-slate-800 pb-2">
            General Information
          </h2>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-slate-300">
                Store Name
              </label>
              <input
                type="text"
                name="storeName"
                value={formData.storeName}
                onChange={handleChange}
                className="mt-1 block w-full bg-slate-950 border border-slate-700 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-blue-600 focus:border-blue-600 sm:text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300">
                Website (https://...)
              </label>
              <input
                type="text"
                name="website"
                value={formData.website}
                onChange={handleChange}
                placeholder="https://yourstore.com"
                className="mt-1 block w-full bg-slate-950 border border-slate-700 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-blue-600 focus:border-blue-600 sm:text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Logo
              </label>
              <div className="flex items-center gap-4">
                {formData.logo && (
                  <div className="h-16 w-16 bg-slate-800 rounded-md overflow-hidden border border-slate-700">
                    <img
                      src={formData.logo}
                      alt="Store Logo"
                      className="h-full w-full object-cover"
                    />
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => setShowMediaLibrary(true)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-md hover:bg-slate-700 hover:text-white transition-colors text-sm"
                >
                  {formData.logo ? "Change Logo" : "Select Logo"}
                </button>
              </div>
            </div>
          </div>
        </div>

        <MediaLibraryModal
          isOpen={showMediaLibrary}
          onClose={() => setShowMediaLibrary(false)}
          onSelect={handleLogoSelect}
        />

        {/* Address & Contact */}
        <div className="bg-slate-900 shadow rounded-lg p-6 border border-slate-800">
          <h2 className="text-lg font-medium text-white mb-4 border-b border-slate-800 pb-2">
            Address & Contact
          </h2>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-slate-300">
                Street Address
              </label>
              <input
                type="text"
                name="street"
                value={formData.address.street}
                onChange={(e) => handleChange(e, "address")}
                className="mt-1 block w-full bg-slate-950 border border-slate-700 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-blue-600 focus:border-blue-600 sm:text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300">
                City
              </label>
              <input
                type="text"
                name="city"
                value={formData.address.city}
                onChange={(e) => handleChange(e, "address")}
                className="mt-1 block w-full bg-slate-950 border border-slate-700 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-blue-600 focus:border-blue-600 sm:text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300">
                Phone
              </label>
              <input
                type="text"
                name="phone"
                value={formData.contact.phone}
                onChange={(e) => handleChange(e, "contact")}
                className="mt-1 block w-full bg-slate-950 border border-slate-700 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-blue-600 focus:border-blue-600 sm:text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300">
                Email
              </label>
              <input
                type="email"
                name="email"
                value={formData.contact.email}
                onChange={(e) => handleChange(e, "contact")}
                className="mt-1 block w-full bg-slate-950 border border-slate-700 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-blue-600 focus:border-blue-600 sm:text-sm"
              />
            </div>
          </div>
        </div>

        {/* SMTP Settings */}
        <div className="bg-slate-900 shadow rounded-lg p-6 border border-slate-800">
          <h2 className="text-lg font-medium text-white mb-4 border-b border-slate-800 pb-2">
            SMTP Configuration (Email)
          </h2>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-slate-300">
                Host
              </label>
              <input
                type="text"
                name="host"
                value={formData.smtp.host}
                onChange={(e) => handleChange(e, "smtp")}
                className="mt-1 block w-full bg-slate-950 border border-slate-700 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-blue-600 focus:border-blue-600 sm:text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300">
                Port
              </label>
              <input
                type="number"
                name="port"
                value={formData.smtp.port}
                onChange={(e) => handleChange(e, "smtp")}
                className="mt-1 block w-full bg-slate-950 border border-slate-700 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-blue-600 focus:border-blue-600 sm:text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300">
                User
              </label>
              <input
                type="text"
                name="user"
                value={formData.smtp.user}
                onChange={(e) => handleChange(e, "smtp")}
                className="mt-1 block w-full bg-slate-950 border border-slate-700 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-blue-600 focus:border-blue-600 sm:text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300">
                Password
              </label>
              <input
                type="password"
                name="pass"
                value={formData.smtp.pass}
                onChange={(e) => handleChange(e, "smtp")}
                className="mt-1 block w-full bg-slate-950 border border-slate-700 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-blue-600 focus:border-blue-600 sm:text-sm"
              />
            </div>
          </div>
        </div>

        {/* Bank Details */}
        <div className="bg-slate-900 shadow rounded-lg p-6 border border-slate-800">
          <h2 className="text-lg font-medium text-white mb-4 border-b border-slate-800 pb-2">
            Bank Details
          </h2>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-slate-300">
                Account Name
              </label>
              <input
                type="text"
                name="accountName"
                value={formData.bank.accountName}
                onChange={(e) => handleChange(e, "bank")}
                className="mt-1 block w-full bg-slate-950 border border-slate-700 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-blue-600 focus:border-blue-600 sm:text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300">
                Account Number
              </label>
              <input
                type="text"
                name="accountNumber"
                value={formData.bank.accountNumber}
                onChange={(e) => handleChange(e, "bank")}
                className="mt-1 block w-full bg-slate-950 border border-slate-700 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-blue-600 focus:border-blue-600 sm:text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300">
                Bank Name
              </label>
              <input
                type="text"
                name="bankName"
                value={formData.bank.bankName}
                onChange={(e) => handleChange(e, "bank")}
                className="mt-1 block w-full bg-slate-950 border border-slate-700 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-blue-600 focus:border-blue-600 sm:text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300">
                Branch
              </label>
              <input
                type="text"
                name="branch"
                value={formData.bank.branch}
                onChange={(e) => handleChange(e, "bank")}
                className="mt-1 block w-full bg-slate-950 border border-slate-700 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-blue-600 focus:border-blue-600 sm:text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300">
                Swift Code
              </label>
              <input
                type="text"
                name="swiftCode"
                value={formData.bank.swiftCode || ""}
                onChange={(e) => handleChange(e, "bank")}
                className="mt-1 block w-full bg-slate-950 border border-slate-700 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-blue-600 focus:border-blue-600 sm:text-sm"
              />
            </div>
          </div>
        </div>

        {/* Tax Settings */}
        <div className="bg-slate-900 shadow rounded-lg p-6 border border-slate-800">
          <h2 className="text-lg font-medium text-white mb-4 border-b border-slate-800 pb-2">
            Tax Configuration
          </h2>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-slate-300">
                Tax Rate (%)
              </label>
              <input
                type="number"
                name="rate"
                min="0"
                max="100"
                step="0.01"
                value={formData.tax.rate}
                onChange={(e) => handleChange(e, "tax")}
                className="mt-1 block w-full bg-slate-950 border border-slate-700 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-blue-600 focus:border-blue-600 sm:text-sm"
                placeholder="0"
              />
              <p className="mt-1 text-xs text-slate-400">
                Enter 0 for no tax. Default tax rate applied to transactions.
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300">
                Tax Label
              </label>
              <input
                type="text"
                name="label"
                value={formData.tax.label}
                onChange={(e) => handleChange(e, "tax")}
                className="mt-1 block w-full bg-slate-950 border border-slate-700 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-blue-600 focus:border-blue-600 sm:text-sm"
                placeholder="Tax"
              />
              <p className="mt-1 text-xs text-slate-400">
                Label shown on invoices (e.g., VAT, GST, Sales Tax)
              </p>
            </div>
          </div>
        </div>

        {/* Currency Settings */}
        <div className="bg-slate-900 shadow rounded-lg p-6 border border-slate-800">
          <h2 className="text-lg font-medium text-white mb-4 border-b border-slate-800 pb-2">
            Currency Configuration
          </h2>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            <div>
              <label className="block text-sm font-medium text-slate-300">
                Currency Code
              </label>
              <select
                name="code"
                value={formData.currency.code}
                onChange={(e) => handleChange(e, "currency")}
                className="mt-1 block w-full bg-slate-950 border border-slate-700 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-blue-600 focus:border-blue-600 sm:text-sm"
              >
                <option value="USD">USD - US Dollar</option>
                <option value="EUR">EUR - Euro</option>
                <option value="GBP">GBP - British Pound</option>
                <option value="INR">INR - Indian Rupee</option>
                <option value="AUD">AUD - Australian Dollar</option>
                <option value="CAD">CAD - Canadian Dollar</option>
                <option value="JPY">JPY - Japanese Yen</option>
                <option value="CNY">CNY - Chinese Yuan</option>
                <option value="AED">AED - UAE Dirham</option>
                <option value="LKR">LKR - Sri Lankan Rupee</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300">
                Currency Symbol
              </label>
              <input
                type="text"
                name="symbol"
                value={formData.currency.symbol}
                onChange={(e) => handleChange(e, "currency")}
                className="mt-1 block w-full bg-slate-950 border border-slate-700 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-blue-600 focus:border-blue-600 sm:text-sm"
                placeholder="$"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300">
                Symbol Position
              </label>
              <select
                name="position"
                value={formData.currency.position}
                onChange={(e) => handleChange(e, "currency")}
                className="mt-1 block w-full bg-slate-950 border border-slate-700 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-blue-600 focus:border-blue-600 sm:text-sm"
              >
                <option value="before">Before (e.g., $100)</option>
                <option value="after">After (e.g., 100$)</option>
              </select>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center px-6 py-3 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            <Save className="mr-2 h-5 w-5" />
            {saving ? "Saving..." : "Save Settings"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default Settings;
