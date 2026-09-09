import { useState, useEffect } from "react";
import axios from "axios";
import { ENDPOINTS } from "../config/api";
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle,
  Clock,
  DollarSign,
  Download,
  Filter,
  RefreshCw,
  Users,
  TrendingDown,
  ChevronDown,
  ChevronUp,
  FileText,
} from "lucide-react";
import { useSelector } from "react-redux";
import { formatCurrency } from "../utils/currency";
import { formatDate } from "../utils/date";

const statusStyles = {
  overdue: "bg-red-900/40 text-red-300 border border-red-700",
  partially_paid: "bg-amber-900/40 text-amber-300 border border-amber-700",
  sent: "bg-blue-900/40 text-blue-300 border border-blue-700",
  draft: "bg-slate-700 text-slate-300 border border-slate-600",
};

const statusLabels = {
  overdue: "Overdue",
  partially_paid: "Partial",
  sent: "Sent",
  draft: "Draft",
};

const StatusBadge = ({ status }) => (
  <span
    className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${statusStyles[status] || "bg-slate-700 text-slate-300"}`}
  >
    {statusLabels[status] || status}
  </span>
);

const DaysOverdueBadge = ({ days }) => {
  if (!days || days <= 0)
    return <span className="text-slate-500 text-xs">—</span>;
  const cls =
    days > 60
      ? "bg-red-900/50 text-red-300"
      : days > 30
        ? "bg-orange-900/50 text-orange-300"
        : "bg-amber-900/50 text-amber-300";
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold ${cls}`}
    >
      <Clock size={11} />
      {days}d
    </span>
  );
};

const OutstandingInvoices = () => {
  const { user } = useSelector((state) => state.auth);
  const { data: settings } = useSelector((state) => state.settings);

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState("invoices"); // "invoices" | "customers"
  const [expandedCustomers, setExpandedCustomers] = useState({});
  const [filters, setFilters] = useState({
    customer: "",
    startDate: "",
    endDate: "",
    status: "",
  });
  const [customerSearch, setCustomerSearch] = useState("");
  const [downloading, setDownloading] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const config = {
        headers: { Authorization: `Bearer ${user.token}` },
        params: {},
      };
      if (filters.startDate) config.params.startDate = filters.startDate;
      if (filters.endDate) config.params.endDate = filters.endDate;
      if (filters.status) config.params.status = filters.status;

      const res = await axios.get(ENDPOINTS.REPORTS_OUTSTANDING, config);
      setData(res.data);
    } catch (err) {
      console.error("Error fetching outstanding invoices:", err);
      setError("Failed to load outstanding invoices.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [filters]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const clearFilters = () => {
    setFilters({ customer: "", startDate: "", endDate: "", status: "" });
    setCustomerSearch("");
  };

  const handleDownloadPDF = async () => {
    try {
      setDownloading(true);
      const config = {
        headers: { Authorization: `Bearer ${user.token}` },
        responseType: "blob",
      };
      const params = {};
      if (filters.startDate) params.startDate = filters.startDate;
      if (filters.endDate) params.endDate = filters.endDate;
      if (filters.status) params.status = filters.status;

      const response = await axios.post(
        ENDPOINTS.PDF_OUTSTANDING_REPORT,
        params,
        config,
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "Outstanding_Invoices_Report.pdf");
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error("Error downloading outstanding report PDF:", err);
      alert("Failed to download outstanding report PDF");
    } finally {
      setDownloading(false);
    }
  };

  const toggleCustomer = (id) => {
    setExpandedCustomers((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const invoices = data?.invoices || [];
  const customerSummary = data?.customerSummary || [];
  const summary = data?.summary || {};

  // Local customer-search filter (client-side)
  const filteredCustomerSummary = customerSearch
    ? customerSummary.filter(
        (c) =>
          c.customerName.toLowerCase().includes(customerSearch.toLowerCase()) ||
          c.email?.toLowerCase().includes(customerSearch.toLowerCase()),
      )
    : customerSummary;

  // Group invoices by customer ID for expanding
  const invoicesByCustomer = {};
  for (const inv of invoices) {
    const id = inv.customer?._id || "unknown";
    if (!invoicesByCustomer[id]) invoicesByCustomer[id] = [];
    invoicesByCustomer[id].push(inv);
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-red-400 mb-1">
            <AlertCircle size={18} />
            <span className="text-xs font-bold uppercase tracking-widest">
              Receivables
            </span>
          </div>
          <h1 className="text-2xl font-bold text-white">
            Outstanding Invoices
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Track unpaid and partially paid invoices. Monitor customer balances
            and overdue amounts.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleDownloadPDF}
            disabled={downloading}
            className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors"
            id="outstanding-download-pdf-btn"
          >
            <Download size={15} />
            {downloading ? "Generating..." : "Download PDF"}
          </button>
          <button
            onClick={fetchData}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors"
            id="outstanding-refresh-btn"
          >
            <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-red-950/40 border border-red-800/50 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-red-400 text-xs font-semibold uppercase tracking-wider">
              Total Outstanding
            </span>
            <DollarSign size={16} className="text-red-400" />
          </div>
          <div className="text-2xl font-bold text-red-300">
            {loading ? "—" : formatCurrency(summary.totalOutstanding, settings)}
          </div>
          <div className="text-slate-500 text-xs mt-1">
            {summary.totalInvoices || 0} invoice(s)
          </div>
        </div>

        <div className="bg-orange-950/30 border border-orange-800/40 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-orange-400 text-xs font-semibold uppercase tracking-wider">
              Overdue
            </span>
            <AlertTriangle size={16} className="text-orange-400" />
          </div>
          <div className="text-2xl font-bold text-orange-300">
            {loading ? "—" : summary.overdueCount || 0}
          </div>
          <div className="text-slate-500 text-xs mt-1">Past due date</div>
        </div>

        <div className="bg-amber-950/30 border border-amber-800/40 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-amber-400 text-xs font-semibold uppercase tracking-wider">
              Partially Paid
            </span>
            <TrendingDown size={16} className="text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-amber-300">
            {loading ? "—" : summary.partiallyPaidCount || 0}
          </div>
          <div className="text-slate-500 text-xs mt-1">In progress</div>
        </div>

        <div className="bg-blue-950/30 border border-blue-800/40 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-blue-400 text-xs font-semibold uppercase tracking-wider">
              Customers Owing
            </span>
            <Users size={16} className="text-blue-400" />
          </div>
          <div className="text-2xl font-bold text-blue-300">
            {loading ? "—" : summary.customersWithDebt || 0}
          </div>
          <div className="text-slate-500 text-xs mt-1">Unique customers</div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
        <div className="flex items-center gap-2 mb-4">
          <Filter size={15} className="text-slate-400" />
          <span className="text-slate-300 text-sm font-medium">Filters</span>
          <button
            onClick={clearFilters}
            className="ml-auto text-xs text-slate-500 hover:text-slate-300 transition-colors"
            id="outstanding-clear-filters-btn"
          >
            Clear all
          </button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs text-slate-400 mb-1">
              From Date
            </label>
            <input
              type="date"
              name="startDate"
              value={filters.startDate}
              onChange={handleFilterChange}
              id="outstanding-start-date"
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">To Date</label>
            <input
              type="date"
              name="endDate"
              value={filters.endDate}
              onChange={handleFilterChange}
              id="outstanding-end-date"
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Status</label>
            <select
              name="status"
              value={filters.status}
              onChange={handleFilterChange}
              id="outstanding-status-filter"
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All statuses</option>
              <option value="overdue">Overdue</option>
              <option value="partially_paid">Partially Paid</option>
              <option value="sent">Sent</option>
              <option value="draft">Draft</option>
            </select>
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-950/50 border border-red-700 rounded-xl p-4 flex items-center gap-3">
          <AlertCircle size={18} className="text-red-400 shrink-0" />
          <span className="text-red-300 text-sm">{error}</span>
          <button
            onClick={fetchData}
            className="ml-auto text-xs text-red-400 hover:text-red-200 underline"
          >
            Retry
          </button>
        </div>
      )}

      {/* View mode toggle */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setViewMode("invoices")}
          id="outstanding-view-invoices-btn"
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            viewMode === "invoices"
              ? "bg-blue-600 text-white"
              : "bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white"
          }`}
        >
          <FileText size={15} />
          Invoice View
        </button>
        <button
          onClick={() => setViewMode("customers")}
          id="outstanding-view-customers-btn"
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            viewMode === "customers"
              ? "bg-blue-600 text-white"
              : "bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white"
          }`}
        >
          <Users size={15} />
          Customer View
        </button>
      </div>

      {/* ====== INVOICE VIEW ====== */}
      {viewMode === "invoices" && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <FileText size={16} className="text-red-400" />
              <span className="font-semibold text-white">
                Outstanding Invoices
              </span>
            </div>
            <span className="text-xs bg-slate-700 text-slate-300 px-2 py-1 rounded-full">
              {invoices.length} invoice(s)
            </span>
          </div>

          {loading ? (
            <div className="flex items-center justify-center h-40">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
            </div>
          ) : invoices.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-slate-500 gap-3">
              <CheckCircle size={36} className="text-green-500" />
              <p className="font-medium text-slate-300">
                No outstanding invoices!
              </p>
              <p className="text-sm">All invoices are fully paid.</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-800/60 text-slate-400 text-xs uppercase tracking-wider">
                      <th className="text-left px-6 py-3 font-medium">
                        Invoice #
                      </th>
                      <th className="text-left px-4 py-3 font-medium">
                        Customer
                      </th>
                      <th className="text-left px-4 py-3 font-medium">
                        Invoice Date
                      </th>
                      <th className="text-left px-4 py-3 font-medium">
                        Due Date
                      </th>
                      <th className="text-right px-4 py-3 font-medium">
                        Total
                      </th>
                      <th className="text-right px-4 py-3 font-medium">Paid</th>
                      <th className="text-right px-4 py-3 font-medium text-red-400">
                        Balance Due
                      </th>
                      <th className="text-left px-4 py-3 font-medium">
                        Status
                      </th>
                      <th className="text-left px-4 py-3 font-medium">
                        Overdue By
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {invoices.map((inv) => (
                      <tr
                        key={inv._id}
                        className={`hover:bg-slate-800/40 transition-colors ${
                          inv.daysOverdue > 60
                            ? "bg-red-950/10"
                            : inv.daysOverdue > 30
                              ? "bg-orange-950/10"
                              : inv.daysOverdue > 0
                                ? "bg-amber-950/10"
                                : ""
                        }`}
                      >
                        <td className="px-6 py-3 font-mono font-semibold text-slate-200">
                          {inv.invoiceNumber}
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-slate-200 font-medium">
                            {inv.customer
                              ? `${inv.customer.firstName || ""} ${inv.customer.lastName || ""}`.trim() ||
                                inv.customerInfo?.company ||
                                "Unknown"
                              : inv.customerInfo?.firstName
                                ? `${inv.customerInfo.firstName} ${inv.customerInfo.lastName || ""}`.trim()
                                : "Unknown"}
                          </div>
                          {(inv.customer?.email || inv.customerInfo?.email) && (
                            <div className="text-slate-500 text-xs">
                              {inv.customer?.email || inv.customerInfo?.email}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3 text-slate-400">
                          {formatDate(inv.invoiceDate, settings) || "—"}
                        </td>
                        <td className="px-4 py-3 text-slate-400">
                          {formatDate(inv.dueDate, settings) || "—"}
                        </td>
                        <td className="px-4 py-3 text-right text-slate-200 font-medium">
                          {formatCurrency(inv.total, settings)}
                        </td>
                        <td className="px-4 py-3 text-right text-green-400 font-medium">
                          {formatCurrency(inv.amountPaid, settings)}
                        </td>
                        <td className="px-4 py-3 text-right text-red-400 font-bold">
                          {formatCurrency(inv.balanceDue, settings)}
                        </td>
                        <td className="px-4 py-3">
                          <StatusBadge status={inv.status} />
                        </td>
                        <td className="px-4 py-3">
                          <DaysOverdueBadge days={inv.daysOverdue} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Totals footer */}
              <div className="border-t border-slate-800 bg-slate-800/30 px-6 py-3 flex flex-wrap items-center justify-end gap-6 text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-slate-500">Total Invoiced:</span>
                  <span className="font-semibold text-slate-200">
                    {formatCurrency(
                      invoices.reduce((s, i) => s + i.total, 0),
                      settings,
                    )}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-slate-500">Total Collected:</span>
                  <span className="font-semibold text-green-400">
                    {formatCurrency(
                      invoices.reduce((s, i) => s + i.amountPaid, 0),
                      settings,
                    )}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-slate-400 font-medium">
                    Total Outstanding:
                  </span>
                  <span className="font-bold text-red-400 text-base">
                    {formatCurrency(summary.totalOutstanding, settings)}
                  </span>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* ====== CUSTOMER VIEW ====== */}
      {viewMode === "customers" && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Users size={16} className="text-blue-400" />
              <span className="font-semibold text-white">
                Customer Balance Summary
              </span>
            </div>
            <span className="text-xs bg-slate-700 text-slate-300 px-2 py-1 rounded-full">
              {customerSummary.length} customer(s)
            </span>
          </div>

          {/* Customer search */}
          <div className="px-6 py-3 border-b border-slate-800">
            <input
              type="text"
              placeholder="Search customers..."
              value={customerSearch}
              onChange={(e) => setCustomerSearch(e.target.value)}
              id="outstanding-customer-search"
              className="w-full max-w-xs bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {loading ? (
            <div className="flex items-center justify-center h-40">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
            </div>
          ) : filteredCustomerSummary.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-slate-500 gap-3">
              <CheckCircle size={36} className="text-green-500" />
              <p className="font-medium text-slate-300">
                {customerSearch
                  ? "No customers match your search."
                  : "No outstanding balances!"}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-800">
              {filteredCustomerSummary.map((cust) => {
                const custInvoices = invoicesByCustomer[cust.customerId] || [];
                const isExpanded = expandedCustomers[cust.customerId];
                const pct = summary.totalOutstanding
                  ? Math.min(
                      (cust.totalOutstanding / summary.totalOutstanding) * 100,
                      100,
                    )
                  : 0;

                return (
                  <div key={cust.customerId}>
                    {/* Customer row */}
                    <div
                      className="flex items-center gap-4 px-6 py-4 hover:bg-slate-800/40 cursor-pointer transition-colors"
                      onClick={() => toggleCustomer(cust.customerId)}
                      id={`outstanding-customer-${cust.customerId}`}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-white text-sm truncate">
                            {cust.customerName}
                          </span>
                          {cust.overdueCount > 0 && (
                            <span className="text-xs bg-red-900/50 text-red-300 border border-red-700 px-2 py-0.5 rounded">
                              {cust.overdueCount} overdue
                            </span>
                          )}
                        </div>
                        {cust.email && (
                          <div className="text-slate-500 text-xs truncate mt-0.5">
                            {cust.email}
                          </div>
                        )}
                        {/* Progress bar */}
                        <div className="mt-2 h-1.5 bg-slate-800 rounded-full overflow-hidden w-full max-w-xs">
                          <div
                            className="h-full bg-red-500/60 rounded-full transition-all"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>

                      <div className="flex items-center gap-6 shrink-0">
                        <div className="text-right">
                          <div className="text-xs text-slate-500">Invoices</div>
                          <div className="font-semibold text-slate-200">
                            {cust.invoiceCount}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-xs text-slate-500">
                            Balance Due
                          </div>
                          <div className="font-bold text-red-400">
                            {formatCurrency(cust.totalOutstanding, settings)}
                          </div>
                        </div>
                        {isExpanded ? (
                          <ChevronUp size={16} className="text-slate-500" />
                        ) : (
                          <ChevronDown size={16} className="text-slate-500" />
                        )}
                      </div>
                    </div>

                    {/* Expanded invoices */}
                    {isExpanded && custInvoices.length > 0 && (
                      <div className="bg-slate-800/30 border-t border-slate-800 px-6 pb-2">
                        <table className="w-full text-xs mt-2">
                          <thead>
                            <tr className="text-slate-500 uppercase tracking-wider">
                              <th className="text-left py-2 font-medium">
                                Invoice #
                              </th>
                              <th className="text-left py-2 font-medium">
                                Date
                              </th>
                              <th className="text-left py-2 font-medium">
                                Due Date
                              </th>
                              <th className="text-right py-2 font-medium">
                                Total
                              </th>
                              <th className="text-right py-2 font-medium">
                                Paid
                              </th>
                              <th className="text-right py-2 font-medium text-red-400">
                                Balance
                              </th>
                              <th className="text-left py-2 font-medium">
                                Status
                              </th>
                              <th className="text-left py-2 font-medium">
                                Overdue
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-800/50">
                            {custInvoices.map((inv) => (
                              <tr
                                key={inv._id}
                                className="hover:bg-slate-800/20 transition-colors"
                              >
                                <td className="py-2 font-mono font-semibold text-slate-200">
                                  {inv.invoiceNumber}
                                </td>
                                <td className="py-2 text-slate-400">
                                  {formatDate(inv.invoiceDate, settings) || "—"}
                                </td>
                                <td className="py-2 text-slate-400">
                                  {formatDate(inv.dueDate, settings) || "—"}
                                </td>
                                <td className="py-2 text-right text-slate-200">
                                  {formatCurrency(inv.total, settings)}
                                </td>
                                <td className="py-2 text-right text-green-400">
                                  {formatCurrency(inv.amountPaid, settings)}
                                </td>
                                <td className="py-2 text-right font-bold text-red-400">
                                  {formatCurrency(inv.balanceDue, settings)}
                                </td>
                                <td className="py-2">
                                  <StatusBadge status={inv.status} />
                                </td>
                                <td className="py-2">
                                  <DaysOverdueBadge days={inv.daysOverdue} />
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Footer */}
          {filteredCustomerSummary.length > 0 && !loading && (
            <div className="border-t border-slate-800 bg-slate-800/30 px-6 py-3 flex items-center justify-end gap-4 text-sm">
              <span className="text-slate-400">Grand Total Outstanding:</span>
              <span className="font-bold text-red-400 text-base">
                {formatCurrency(summary.totalOutstanding, settings)}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default OutstandingInvoices;
