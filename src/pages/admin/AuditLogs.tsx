
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Search,
  RefreshCw,
  FileClock,
  Activity,
  Plus,
  Pencil,
  Trash2,
  LogIn,
  ShieldCheck,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { supabase } from "../../lib/supabase";

interface AuditLog {
  id: string;
  user_id: string | null;
  action: string;
  description: string | null;
  created_at: string;
}

const ITEMS_PER_PAGE = 10;

const getActionIcon = (action: string) => {
  const value = action.toLowerCase();

  if (value.includes("delete")) return Trash2;
  if (value.includes("update") || value.includes("edit")) return Pencil;
  if (value.includes("create") || value.includes("add")) return Plus;
  if (value.includes("login")) return LogIn;
  if (value.includes("admin")) return ShieldCheck;

  return Activity;
};

const getActionColor = (action: string) => {
  const value = action.toLowerCase();

  if (value.includes("delete")) {
    return "bg-red-100 text-red-700";
  }

  if (value.includes("update") || value.includes("edit")) {
    return "bg-amber-100 text-amber-700";
  }

  if (value.includes("create") || value.includes("add")) {
    return "bg-green-100 text-green-700";
  }

  if (value.includes("login")) {
    return "bg-blue-100 text-blue-700";
  }

  return "bg-gray-100 text-gray-700";
};

export default function AuditLogs() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedAction, setSelectedAction] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    setError("");

    const { data, error } = await supabase
      .from("audit_logs")
      .select("id, user_id, action, description, created_at")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching audit logs:", error);
      setError(error.message);
      setLogs([]);
    } else {
      setLogs((data ?? []) as AuditLog[]);
    }

    setCurrentPage(1);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const actionTypes = useMemo(() => {
    return [
      "All",
      ...Array.from(new Set(logs.map((log) => log.action))).sort(),
    ];
  }, [logs]);

  const filteredLogs = useMemo(() => {
    const search = searchTerm.trim().toLowerCase();

    return logs.filter((log) => {
      const matchesSearch =
        (log.action ?? "").toLowerCase().includes(search) ||
        (log.description ?? "").toLowerCase().includes(search) ||
        (log.user_id ?? "").toLowerCase().includes(search);

      const matchesAction =
        selectedAction === "All" || log.action === selectedAction;

      return matchesSearch && matchesAction;
    });
  }, [logs, searchTerm, selectedAction]);

  const totalPages = Math.ceil(filteredLogs.length / ITEMS_PER_PAGE);

  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;

  const paginatedLogs = filteredLogs.slice(
    startIndex,
    startIndex + ITEMS_PER_PAGE
  );

  const firstRecord =
    filteredLogs.length === 0 ? 0 : startIndex + 1;

  const lastRecord = Math.min(
    startIndex + ITEMS_PER_PAGE,
    filteredLogs.length
  );

  // Keep the current page valid when filtering reduces the results.
  useEffect(() => {
    if (totalPages === 0 && currentPage !== 1) {
      setCurrentPage(1);
    } else if (totalPages > 0 && currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const todayCount = logs.filter(
    (log) =>
      new Date(log.created_at).toDateString() ===
      new Date().toDateString()
  ).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Audit Logs
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Monitor and review recorded activities in the system.
          </p>
        </div>

        <button
          onClick={fetchLogs}
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
        >
          <RefreshCw
            size={16}
            className={loading ? "animate-spin" : ""}
          />
          Refresh
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">
                Total Recorded Activities
              </p>
              <p className="mt-2 text-2xl font-bold text-gray-900">
                {logs.length}
              </p>
            </div>
            <div className="rounded-lg bg-blue-50 p-3 text-blue-600">
              <FileClock size={22} />
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">
                Activities Today
              </p>
              <p className="mt-2 text-2xl font-bold text-gray-900">
                {todayCount}
              </p>
            </div>
            <div className="rounded-lg bg-green-50 p-3 text-green-600">
              <Activity size={22} />
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Search actions, descriptions, or user IDs..."
            className="w-full rounded-lg border border-gray-200 py-2.5 pl-10 pr-4 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
        </div>

        <select
          value={selectedAction}
          onChange={(e) => {
            setSelectedAction(e.target.value);
            setCurrentPage(1);
          }}
          className="rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-blue-500"
        >
          {actionTypes.map((action) => (
            <option key={action} value={action}>
              {action === "All" ? "All Actions" : action}
            </option>
          ))}
        </select>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <AlertCircle size={20} className="mt-0.5 shrink-0" />
          <div>
            <p className="font-semibold">
              Unable to load audit logs
            </p>
            <p className="mt-1">{error}</p>
          </div>
        </div>
      )}

      {/* Logs Table */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        <div className="border-b border-gray-200 px-5 py-4">
          <h2 className="font-semibold text-gray-900">
            Activity History
          </h2>
          <p className="mt-1 text-xs text-gray-500">
            Showing {firstRecord}–{lastRecord} of {filteredLogs.length} filtered records
            ({logs.length} total records)
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center gap-2 py-12 text-sm text-gray-500">
            <RefreshCw size={18} className="animate-spin" />
            Loading audit logs...
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="py-12 text-center">
            <FileClock size={36} className="mx-auto text-gray-300" />
            <p className="mt-3 font-medium text-gray-700">
              No audit logs found
            </p>
            <p className="mt-1 text-sm text-gray-500">
              Recorded activities will appear here.
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[750px] text-left text-sm">
                <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                  <tr>
                    <th className="px-5 py-3 font-semibold">
                      Action
                    </th>
                    <th className="px-5 py-3 font-semibold">
                      Description
                    </th>
                    <th className="px-5 py-3 font-semibold">
                      User ID
                    </th>
                    <th className="px-5 py-3 font-semibold">
                      Date & Time
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-100">
                  {paginatedLogs.map((log) => {
                    const Icon = getActionIcon(log.action);

                    return (
                      <tr key={log.id} className="hover:bg-gray-50">
                        <td className="px-5 py-4">
                          <span
                            className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium ${getActionColor(
                              log.action
                            )}`}
                          >
                            <Icon size={14} />
                            {log.action}
                          </span>
                        </td>

                        <td className="max-w-xs px-5 py-4 text-gray-700">
                          {log.description || "No description provided"}
                        </td>

                        <td className="px-5 py-4 text-gray-500">
                          <span className="font-mono text-xs">
                            {log.user_id || "System"}
                          </span>
                        </td>

                        <td className="whitespace-nowrap px-5 py-4 text-gray-500">
                          {formatDate(log.created_at)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex flex-col gap-4 border-t border-gray-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-gray-500">
                Page {currentPage} of {totalPages}
              </p>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() =>
                    setCurrentPage((previous) =>
                      Math.max(1, previous - 1)
                    )
                  }
                  disabled={currentPage === 1}
                  className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ChevronLeft size={16} />
                  Previous
                </button>

                {Array.from(
                  { length: totalPages },
                  (_, index) => index + 1
                ).map((page) => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    aria-current={
                      currentPage === page ? "page" : undefined
                    }
                    className={`h-9 min-w-9 rounded-lg px-3 text-sm font-medium transition ${
                      currentPage === page
                        ? "bg-emerald-600 text-white"
                        : "border border-gray-200 text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    {page}
                  </button>
                ))}

                <button
                  onClick={() =>
                    setCurrentPage((previous) =>
                      Math.min(totalPages, previous + 1)
                    )
                  }
                  disabled={currentPage === totalPages}
                  className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Next
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
