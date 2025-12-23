import { useState } from "react";
import { X, Eye, Code } from "lucide-react";

const ActivityLogModal = ({ isOpen, onClose, log }) => {
  const [viewMode, setViewMode] = useState("readable"); // 'readable' or 'raw'

  if (!isOpen || !log) return null;

  const formatFieldName = (name) => {
    if (!name) return "";
    // Handle common abbreviations or specific terms
    const specialCases = {
      wooId: "WooCommerce ID",
      sku: "SKU",
      ip: "IP Address",
      id: "ID",
      _id: "Internal ID",
    };

    if (specialCases[name]) return specialCases[name];

    return name
      .replace(/([A-Z])/g, " $1")
      .replace(/^./, (str) => str.toUpperCase())
      .replace(/_/g, " ")
      .trim();
  };

  const formatValue = (val) => {
    if (val === null || val === undefined) return "None";
    if (typeof val === "boolean") return val ? "Yes" : "No";

    if (Array.isArray(val)) {
      if (val.length === 0) return "Empty List";
      return (
        <div className="space-y-1 mt-1">
          {val.map((item, idx) => (
            <div
              key={idx}
              className="pl-3 border-l-2 border-slate-800 py-1 text-slate-300"
            >
              {formatValue(item)}
            </div>
          ))}
        </div>
      );
    }

    if (typeof val === "object") {
      // Special handling for common objects like line items, addresses, etc.
      if (val.name && val.price !== undefined) {
        const qty = val.quantity !== undefined ? ` (Qty: ${val.quantity})` : "";
        return (
          <span className="text-blue-300 font-medium">
            {val.name}
            {qty} - {val.price.toLocaleString()}
          </span>
        );
      }

      if (
        val.first_name ||
        val.last_name ||
        val.address_1 ||
        val.city ||
        val.country
      ) {
        const name = [val.first_name, val.last_name].filter(Boolean).join(" ");
        const company = val.company ? `(${val.company})` : "";
        const addr = [
          val.address_1,
          val.address_2,
          val.city,
          val.postcode,
          val.country,
        ]
          .filter(Boolean)
          .join(", ");
        const contact = [val.email, val.phone].filter(Boolean).join(" / ");

        return (
          [name, company, addr, contact].filter(Boolean).join(" | ") ||
          "Empty Address"
        );
      }

      // Try to find a descriptive property
      const descriptiveKeys = [
        "name",
        "title",
        "label",
        "email",
        "username",
        "filename",
      ];
      for (const key of descriptiveKeys) {
        if (val[key] && typeof val[key] === "string") return val[key];
      }

      // If it's a small object, show its properties in a readable way
      const entries = Object.entries(val).filter(
        ([k]) => !k.startsWith("_") && k !== "id" && k !== "product"
      );
      if (entries.length > 0 && entries.length <= 8) {
        return (
          <div className="grid grid-cols-1 gap-x-4 gap-y-1 mt-1">
            {entries.map(([k, v]) => (
              <div key={k} className="text-xs flex items-baseline gap-2">
                <span className="text-slate-500 font-medium min-w-[80px]">
                  {formatFieldName(k)}:
                </span>
                <span className="text-slate-300">{formatValue(v)}</span>
              </div>
            ))}
          </div>
        );
      }

      return JSON.stringify(val);
    }

    // Check if it's a date string
    if (
      typeof val === "string" &&
      val.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)
    ) {
      return new Date(val).toLocaleString();
    }

    // Format numbers as currency if they look like prices (heuristic)
    if (typeof val === "number" && val > 100) {
      return val.toLocaleString();
    }

    return String(val);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-slate-900 w-full max-w-2xl rounded-lg shadow-xl border border-slate-800 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-800">
          <h2 className="text-xl font-bold text-white">Activity Details</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto custom-scrollbar">
          <div className="space-y-6">
            {/* Basic Info Grid */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">
                  Timestamp
                </label>
                <div className="text-white">
                  {new Date(log.createdAt).toLocaleString()}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">
                  User
                </label>
                <div className="text-white">
                  {log.user ? log.user.name : "Guest/System"}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">
                  Action
                </label>
                <div className="flex items-center">
                  <span
                    className={`px-2 py-1 text-xs font-semibold rounded-full ${
                      log.action === "create"
                        ? "bg-green-500/20 text-green-400"
                        : log.action === "update"
                        ? "bg-blue-500/20 text-blue-400"
                        : log.action === "delete"
                        ? "bg-red-500/20 text-red-400"
                        : "bg-slate-500/20 text-slate-400"
                    }`}
                  >
                    {log.action?.toUpperCase()}
                  </span>
                  <span className="ml-2 text-white">{log.collectionName}</span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">
                  IP Address
                </label>
                <div className="text-white font-mono text-sm">
                  {log.ip || "Unknown"}
                </div>
              </div>
            </div>

            {/* Changes */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-slate-400">
                  Changes / Details
                </label>
                <div className="flex bg-slate-800 p-1 rounded-md">
                  <button
                    onClick={() => setViewMode("readable")}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-medium transition-all ${
                      viewMode === "readable"
                        ? "bg-blue-600 text-white shadow-sm"
                        : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    <Eye size={14} />
                    Readable
                  </button>
                  <button
                    onClick={() => setViewMode("raw")}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-medium transition-all ${
                      viewMode === "raw"
                        ? "bg-blue-600 text-white shadow-sm"
                        : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    <Code size={14} />
                    Raw JSON
                  </button>
                </div>
              </div>

              <div className="bg-slate-950 rounded-lg border border-slate-800 overflow-hidden">
                {viewMode === "readable" ? (
                  log.changes && typeof log.changes === "object" ? (
                    <div className="divide-y divide-slate-800">
                      {Object.entries(log.changes).map(([field, value]) => {
                        const hasDiff =
                          value &&
                          typeof value === "object" &&
                          ("old" in value || "new" in value);

                        return (
                          <div key={field} className="p-4">
                            <div className="text-sm font-semibold text-slate-300 mb-2">
                              {formatFieldName(field)}
                            </div>
                            <div className="space-y-2">
                              {hasDiff ? (
                                <>
                                  {value.old !== undefined && (
                                    <div className="flex items-start gap-3">
                                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-red-500/10 text-red-400 uppercase w-10 text-center mt-0.5">
                                        From
                                      </span>
                                      <div className="text-slate-400 text-sm flex-1">
                                        {formatValue(value.old)}
                                      </div>
                                    </div>
                                  )}
                                  {value.new !== undefined && (
                                    <div className="flex items-start gap-3">
                                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-green-500/10 text-green-400 uppercase w-10 text-center mt-0.5">
                                        To
                                      </span>
                                      <div className="text-white text-sm font-medium flex-1">
                                        {formatValue(value.new)}
                                      </div>
                                    </div>
                                  )}
                                </>
                              ) : (
                                <div className="text-white text-sm">
                                  {formatValue(value)}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : log.url ? (
                    <div className="p-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="text-slate-400 text-xs uppercase font-bold w-16">
                            URL:
                          </span>
                          <span className="text-blue-400 text-sm font-mono">
                            {log.url}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-slate-400 text-xs uppercase font-bold w-16">
                            Method:
                          </span>
                          <span className="text-white text-sm font-mono">
                            {log.method}
                          </span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="p-8 text-center text-slate-500 text-sm italic">
                      No detailed changes recorded for this activity.
                    </div>
                  )
                ) : log.changes && typeof log.changes === "object" ? (
                  <div className="divide-y divide-slate-800">
                    {Object.entries(log.changes).map(([field, value]) => {
                      // Check if it's the new diff format {old, new}
                      const hasDiff =
                        value &&
                        typeof value === "object" &&
                        ("old" in value || "new" in value);

                      if (hasDiff) {
                        return (
                          <div key={field} className="p-4">
                            <div className="text-sm font-medium text-slate-300 mb-2 font-mono">
                              {field}
                            </div>
                            <div className="space-y-1">
                              {value.old !== undefined && (
                                <div className="flex items-start gap-2">
                                  <span className="text-red-400 text-xs font-semibold mt-1">
                                    OLD:
                                  </span>
                                  <span className="text-red-300 text-sm line-through flex-1 break-all">
                                    {typeof value.old === "object"
                                      ? JSON.stringify(value.old, null, 2)
                                      : String(value.old)}
                                  </span>
                                </div>
                              )}
                              {value.new !== undefined && (
                                <div className="flex items-start gap-2">
                                  <span className="text-green-400 text-xs font-semibold mt-1">
                                    NEW:
                                  </span>
                                  <span className="text-green-300 text-sm flex-1 break-all">
                                    {typeof value.new === "object"
                                      ? JSON.stringify(value.new, null, 2)
                                      : String(value.new)}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      } else {
                        // Legacy format or simple value
                        return (
                          <div key={field} className="p-4">
                            <div className="text-sm font-medium text-slate-300 mb-1 font-mono">
                              {field}
                            </div>
                            <div className="text-blue-300 text-sm break-all">
                              {typeof value === "object"
                                ? JSON.stringify(value, null, 2)
                                : String(value)}
                            </div>
                          </div>
                        );
                      }
                    })}
                  </div>
                ) : log.url ? (
                  <div className="p-4">
                    <pre className="text-sm text-blue-400 font-mono whitespace-pre-wrap">
                      {`URL: ${log.url}\nMethod: ${log.method}`}
                    </pre>
                  </div>
                ) : (
                  <div className="p-4 text-center text-slate-400 text-sm">
                    No details available
                  </div>
                )}
              </div>
            </div>

            {/* User Agent */}
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">
                User Agent
              </label>
              <div className="text-slate-300 text-sm break-all">
                {log.userAgent}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 text-white rounded hover:bg-slate-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ActivityLogModal;
