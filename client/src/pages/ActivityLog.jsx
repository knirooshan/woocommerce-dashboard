import { useState, useEffect } from "react";
import axios from "axios";
import { ENDPOINTS, API_URL } from "../config/api";
import { useSelector } from "react-redux";
import { ArrowLeft, RefreshCw, Eye } from "lucide-react";
import { Link } from "react-router-dom";
import ActivityLogModal from "../components/ActivityLogModal";

const ActivityLog = () => {
  const { user } = useSelector((state) => state.auth);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [selectedLog, setSelectedLog] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    fetchLogs(page);
  }, [page, user.token]);

  const fetchLogs = async (pageNumber) => {
    try {
      setLoading(true);
      const token = user.token;
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const { data } = await axios.get(
        `${API_URL}/activity-logs?pageNumber=${pageNumber}`,
        config
      );
      setLogs(data.logs);
      setPages(data.pages);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching logs:", error);
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <Link
            to="/settings"
            className="text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="h-6 w-6" />
          </Link>
          <h1 className="text-2xl font-bold text-white">Activity Log</h1>
        </div>
        <button
          onClick={() => fetchLogs(page)}
          className="flex items-center px-4 py-2 bg-slate-800 text-white rounded hover:bg-slate-700 transition-colors"
        >
          <RefreshCw className="mr-2 h-4 w-4" /> Refresh
        </button>
      </div>

      <div className="bg-slate-900 shadow rounded-lg overflow-hidden border border-slate-800">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-800">
            <thead className="bg-slate-950">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Timestamp
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Action
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-slate-900 divide-y divide-slate-800">
              {loading ? (
                <tr>
                  <td
                    colSpan="5"
                    className="px-6 py-4 text-center text-slate-400"
                  >
                    Loading logs...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td
                    colSpan="5"
                    className="px-6 py-4 text-center text-slate-400"
                  >
                    No activity logs found.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log._id} className="hover:bg-slate-800/50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                      {log.user ? log.user.name : "Guest/System"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          log.action === "create"
                            ? "bg-green-100 text-green-800"
                            : log.action === "update"
                            ? "bg-blue-100 text-blue-800"
                            : log.action === "delete"
                            ? "bg-red-100 text-red-800"
                            : "bg-slate-100 text-slate-800"
                        }`}
                      >
                        {log.action} {log.collectionName}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => {
                          setSelectedLog(log);
                          setIsModalOpen(true);
                        }}
                        className="text-blue-400 hover:text-blue-300 transition-colors"
                        title="View Details"
                      >
                        <Eye size={18} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pages > 1 && (
          <div className="bg-slate-950 px-4 py-3 flex items-center justify-between border-t border-slate-800 sm:px-6">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="relative inline-flex items-center px-4 py-2 border border-slate-700 text-sm font-medium rounded-md text-slate-300 bg-slate-900 hover:bg-slate-800 disabled:opacity-50"
              >
                Previous
              </button>
              <button
                onClick={() => setPage((p) => Math.min(pages, p + 1))}
                disabled={page === pages}
                className="ml-3 relative inline-flex items-center px-4 py-2 border border-slate-700 text-sm font-medium rounded-md text-slate-300 bg-slate-900 hover:bg-slate-800 disabled:opacity-50"
              >
                Next
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-slate-400">
                  Page <span className="font-medium">{page}</span> of{" "}
                  <span className="font-medium">{pages}</span>
                </p>
              </div>
              <div>
                <nav
                  className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px"
                  aria-label="Pagination"
                >
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-slate-700 bg-slate-900 text-sm font-medium text-slate-400 hover:bg-slate-800 disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setPage((p) => Math.min(pages, p + 1))}
                    disabled={page === pages}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-slate-700 bg-slate-900 text-sm font-medium text-slate-400 hover:bg-slate-800 disabled:opacity-50"
                  >
                    Next
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>

      <ActivityLogModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        log={selectedLog}
      />
    </div>
  );
};

export default ActivityLog;
