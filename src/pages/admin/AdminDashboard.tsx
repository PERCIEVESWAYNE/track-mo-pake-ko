
import { useEffect, useState } from "react";
import {
  Users,
  RefreshCw,
  ShieldCheck,
  UserCheck,
  UserX,
  CalendarDays,
} from "lucide-react";
import { supabase } from "../../lib/supabase";

type Profile = {
  id: string;
  full_name: string | null;
  email: string | null;
  role: string;
  created_at: string;
  is_active: boolean;
};

export default function AdminDashboard() {
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadAdminData() {
    setLoading(true);
    setError("");

    try {
      const { data, error: profilesError } = await supabase
        .from("profiles")
        .select("id, full_name, email, role, created_at, is_active")
        .order("created_at", { ascending: false });

      if (profilesError) throw profilesError;

      setUsers((data ?? []) as Profile[]);
    } catch (err) {
      console.error("Admin dashboard error:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Unable to load administrator data."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAdminData();
  }, []);

  // Account statistics only.
  // No expenses, budgets, or private financial information are retrieved.
  const regularUsers = users.filter((user) => user.role === "user");
  const administratorUsers = users.filter((user) => user.role === "admin");

  const activeUsers = regularUsers.filter((user) => user.is_active);
  const inactiveUsers = regularUsers.filter((user) => !user.is_active);

  const recentAccounts = users.slice(0, 5);

  const formatDate = (date: string) => {
    if (!date) return "—";

    return new Date(date).toLocaleDateString("en-PH", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const summaryCards = [
    {
      title: "Registered Accounts",
      count: users.length,
      description: "Total accounts in the system",
      icon: Users,
      iconStyle: "bg-blue-50 text-blue-600",
    },
    {
      title: "Active Users",
      count: activeUsers.length,
      description: "User accounts with active access",
      icon: UserCheck,
      iconStyle: "bg-emerald-50 text-emerald-600",
    },
    {
      title: "Inactive Users",
      count: inactiveUsers.length,
      description: "User accounts with restricted access",
      icon: UserX,
      iconStyle: "bg-red-50 text-red-600",
    },
    {
      title: "Administrators",
      count: administratorUsers.length,
      description: "Registered administrator accounts",
      icon: ShieldCheck,
      iconStyle: "bg-purple-50 text-purple-600",
    },
  ];

  return (
    <div className="space-y-7">
      {/* Dashboard Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Administrator Dashboard
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Welcome! Here's an overview of Track Mo, Pake Ko!
          </p>
        </div>

        <button
          onClick={loadAdminData}
          disabled={loading}
          className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
        >
          <RefreshCw
            size={16}
            className={loading ? "animate-spin" : ""}
          />
          Refresh
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Account Overview */}
      <section>
        <div className="mb-4">
          <h2 className="text-lg font-bold text-gray-900">
            Account Overview
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            A quick summary of registered accounts and their access status.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {summaryCards.map((card) => {
            const Icon = card.icon;

            return (
              <div
                key={card.title}
                className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm text-gray-500">
                      {card.title}
                    </p>

                    <h3 className="mt-3 text-3xl font-bold text-gray-900">
                      {loading ? "—" : card.count}
                    </h3>
                  </div>

                  <div className={`rounded-lg p-3 ${card.iconStyle}`}>
                    <Icon size={22} />
                  </div>
                </div>

                <p className="mt-3 text-xs text-gray-400">
                  {card.description}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Recent Registered Accounts */}
      <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 p-5">
          <div>
            <div className="flex items-center gap-2">
              <CalendarDays
                size={20}
                className="text-emerald-600"
              />

              <h2 className="text-lg font-bold text-gray-900">
                Recent Registered Accounts
              </h2>
            </div>

            <p className="mt-1 text-sm text-gray-500">
              The five most recently registered accounts.
            </p>
          </div>

          <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600">
            Latest 5 accounts
          </span>
        </div>

        {loading ? (
          <div className="p-8 text-center text-sm text-gray-500">
            Loading registered accounts...
          </div>
        ) : error ? (
          <div className="p-8 text-center text-sm text-gray-500">
            Unable to display registered accounts.
          </div>
        ) : recentAccounts.length === 0 ? (
          <div className="p-8 text-center text-sm text-gray-500">
            No registered accounts available.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[650px] text-left text-sm">
              <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                <tr>
                  <th className="px-5 py-4 font-semibold">
                    Full Name
                  </th>

                  <th className="px-5 py-4 font-semibold">
                    Email
                  </th>

                  <th className="px-5 py-4 font-semibold">
                    Role
                  </th>

                  <th className="px-5 py-4 font-semibold">
                    Date Registered
                  </th>

                  <th className="px-5 py-4 font-semibold">
                    Status
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">
                {recentAccounts.map((user) => (
                  <tr
                    key={user.id}
                    className="transition hover:bg-gray-50"
                  >
                    <td className="px-5 py-4 font-medium text-gray-900">
                      {user.full_name || "No name provided"}
                    </td>

                    <td className="px-5 py-4 text-gray-600">
                      {user.email || "No email"}
                    </td>

                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                          user.role === "admin"
                            ? "bg-purple-100 text-purple-700"
                            : "bg-blue-100 text-blue-700"
                        }`}
                      >
                        {user.role === "admin"
                          ? "Administrator"
                          : "User"}
                      </span>
                    </td>

                    <td className="px-5 py-4 text-gray-600">
                      {formatDate(user.created_at)}
                    </td>

                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                          user.is_active
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-red-50 text-red-700"
                        }`}
                      >
                        {user.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
