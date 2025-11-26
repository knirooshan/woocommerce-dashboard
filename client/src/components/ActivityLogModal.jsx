import { X } from "lucide-react";

const ActivityLogModal = ({ isOpen, onClose, log }) => {
  if (!isOpen || !log) return null;

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
              <label className="block text-sm font-medium text-slate-400 mb-2">
                Changes / Details
              </label>
              <div className="bg-slate-950 rounded-lg border border-slate-800 overflow-hidden">
                {log.changes && typeof log.changes === "object" ? (
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
