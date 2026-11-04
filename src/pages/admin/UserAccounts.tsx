
import { useEffect, useMemo, useState } from "react";
import {
  Search,
  Users,
  ShieldCheck,
  RefreshCw,
  UserCheck,
  UserX,
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

export default function UserAccounts() {
  const [users, setUsers] = useState<Profile[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState<"user" | "admin">("user");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // Load registered accounts.
  // This component intentionally does not retrieve expenses or budgets.
  async function loadData() {
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const {
        data: { user: currentUser },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError) throw authError;

      if (!currentUser) {
        throw new Error(
          "Your session has expired. Please log in again."
        );
      }

      setCurrentUserId(currentUser.id);

      const { data, error: profilesError } = await supabase
        .from("profiles")
        .select(
          "id, full_name, email, role, created_at, is_active"
        )
        .order("created_at", { ascending: false });

      if (profilesError) throw profilesError;

      setUsers((data ?? []) as Profile[]);
    } catch (err) {
      console.error("User accounts error:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Unable to load account information."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  // Format registration date.
  const formatDate = (date: string) => {
    if (!date) return "—";

    return new Date(date).toLocaleDateString("en-PH", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Separate accounts according to their roles.
  const regularUsers = users.filter(
    (user) => user.role === "user"
  );

  const administratorUsers = users.filter(
    (user) => user.role === "admin"
  );

  // Filter accounts based on the selected tab and search input.
  const filteredUsers = useMemo(() => {
    const search = searchTerm.toLowerCase().trim();

    return users.filter((user) => {
      const matchesRole = user.role === activeTab;

      const matchesSearch =
        (user.full_name ?? "").toLowerCase().includes(search) ||
        (user.email ?? "").toLowerCase().includes(search);

      return matchesRole && matchesSearch;
    });
  }, [users, searchTerm, activeTab]);

  // Activate or deactivate a regular user account.
  async function toggleAccountStatus(account: Profile) {
    if (account.role !== "user") {
      setError(
        "Only regular user accounts can be activated or deactivated."
      );
      return;
    }

    if (account.id === currentUserId) {
      setError("You cannot deactivate your own account.");
      return;
    }

    const nextStatus = !account.is_active;

    const confirmed = window.confirm(
      `Are you sure you want to ${
        nextStatus ? "activate" : "deactivate"
      } ${
        account.full_name || account.email || "this account"
      }?`
    );

    if (!confirmed) return;

    setUpdatingId(account.id);
    setError("");
    setSuccess("");

    try {
      // Secure Supabase RPC function.
      // Parameter names must match the SQL function signature.
      const { error: rpcError } = await supabase.rpc(
        "admin_set_account_active",
        {
          p_target_user_id: account.id,
          p_is_active: nextStatus,
        }
      );

      if (rpcError) throw rpcError;

      // Update the account status in the interface.
      setUsers((previousUsers) =>
        previousUsers.map((user) =>
          user.id === account.id
            ? { ...user, is_active: nextStatus }
            : user
        )
      );

      setSuccess(
        `${
          account.full_name || account.email || "Account"
        } has been ${
          nextStatus ? "activated" : "deactivated"
        } successfully.`
      );
    } catch (err) {
      console.error("Account status update error:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Unable to update account status."
      );
    } finally {
      setUpdatingId(null);
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Users className="text-emerald-600" size={25} />

            <h1 className="text-2xl font-bold text-gray-900">
              User Management
            </h1>
          </div>

          <p className="mt-2 text-sm text-gray-500">
            Manage registered accounts and their access status.
          </p>
        </div>

        <button
          onClick={loadData}
          disabled={loading}
          className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
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

      {/* Success Message */}
      {success && (
        <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-700">
          {success}
        </div>
      )}

      {loading && users.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white p-10 text-center text-sm text-gray-500">
          Loading account records...
        </div>
      ) : (
        <>
          {/* Account Summary */}
          <div className="grid gap-5 sm:grid-cols-2">
            {/* Registered Users */}
            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <div className="mb-4 inline-flex rounded-lg bg-blue-50 p-3 text-blue-600">
                <Users size={23} />
              </div>

              <p className="text-sm text-gray-500">
                Registered Users
              </p>

              <h2 className="mt-2 text-3xl font-bold text-gray-900">
                {regularUsers.length}
              </h2>

              <p className="mt-2 text-xs text-gray-400">
                Accounts with the user role
              </p>
            </div>

            {/* Administrator Accounts */}
            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <div className="mb-4 inline-flex rounded-lg bg-purple-50 p-3 text-purple-600">
                <ShieldCheck size={23} />
              </div>

              <p className="text-sm text-gray-500">
                Administrator Accounts
              </p>

              <h2 className="mt-2 text-3xl font-bold text-gray-900">
                {administratorUsers.length}
              </h2>

              <p className="mt-2 text-xs text-gray-400">
                Accounts with the admin role
              </p>
            </div>
          </div>

          {/* Account Management List */}
          <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
            <div className="space-y-5 border-b border-gray-100 p-5">
              <div>
                <h2 className="text-lg font-bold text-gray-900">
                  Account Management
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  View registered accounts and manage user access.
                </p>
              </div>

              {/* Users and Administrators Tabs */}
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => {
                    setActiveTab("user");
                    setSearchTerm("");
                  }}
                  className={`rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors ${
                    activeTab === "user"
                      ? "bg-emerald-600 text-white"
                      : "border border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  Users ({regularUsers.length})
                </button>

                <button
                  onClick={() => {
                    setActiveTab("admin");
                    setSearchTerm("");
                  }}
                  className={`rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors ${
                    activeTab === "admin"
                      ? "bg-purple-600 text-white"
                      : "border border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  Administrators ({administratorUsers.length})
                </button>
              </div>

              {/* Tab Description and Search */}
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h3 className="font-bold text-gray-900">
                    {activeTab === "user"
                      ? "Registered Users"
                      : "Administrator Accounts"}
                  </h3>

                  <p className="mt-1 text-sm text-gray-500">
                    {activeTab === "user"
                      ? "Manage registered user accounts and access status."
                      : "View administrator account details."}
                  </p>
                </div>

                <div className="relative w-full sm:w-72">
                  <Search
                    size={17}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  />

                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(event) =>
                      setSearchTerm(event.target.value)
                    }
                    placeholder={
                      activeTab === "user"
                        ? "Search users..."
                        : "Search administrators..."
                    }
                    className="w-full rounded-lg border border-gray-200 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-emerald-500"
                  />
                </div>
              </div>
            </div>

            {/* Account Table */}
            {loading ? (
              <div className="p-8 text-center text-sm text-gray-500">
                Loading account records...
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="p-8 text-center">
                <div className="mx-auto mb-3 inline-flex rounded-full bg-gray-100 p-3 text-gray-400">
                  {activeTab === "user" ? (
                    <Users size={24} />
                  ) : (
                    <ShieldCheck size={24} />
                  )}
                </div>

                <p className="text-sm font-medium text-gray-700">
                  {searchTerm.trim()
                    ? "No matching accounts found."
                    : activeTab === "user"
                      ? "No user accounts found."
                      : "No administrator accounts found."}
                </p>

                <p className="mt-1 text-xs text-gray-400">
                  {searchTerm.trim()
                    ? "Try another name or email address."
                    : "Accounts with this role will appear here."}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[850px] text-left text-sm">
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
                        Account Status
                      </th>

                      {activeTab === "user" && (
                        <th className="px-5 py-4 text-right font-semibold">
                          Action
                        </th>
                      )}
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-gray-100">
                    {filteredUsers.map((user) => (
                      <tr
                        key={user.id}
                        className="hover:bg-gray-50"
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

                        {activeTab === "user" && (
                          <td className="px-5 py-4 text-right">
                            <button
                              onClick={() =>
                                toggleAccountStatus(user)
                              }
                              disabled={
                                updatingId === user.id ||
                                user.id === currentUserId
                              }
                              title={
                                user.id === currentUserId
                                  ? "You cannot change your own account status."
                                  : user.is_active
                                    ? "Deactivate account"
                                    : "Activate account"
                              }
                              className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50 ${
                                user.is_active
                                  ? "bg-red-600 hover:bg-red-700"
                                  : "bg-emerald-600 hover:bg-emerald-700"
                              }`}
                            >
                              {updatingId === user.id ? (
                                <RefreshCw
                                  size={15}
                                  className="animate-spin"
                                />
                              ) : user.is_active ? (
                                <UserX size={15} />
                              ) : (
                                <UserCheck size={15} />
                              )}

                              {updatingId === user.id
                                ? "Updating..."
                                : user.is_active
                                  ? "Deactivate"
                                  : "Activate"}
                            </button>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
