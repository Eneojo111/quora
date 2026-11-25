import { useCallback, useEffect, useState } from "react";
import {
  Search,
  Users,
  ShieldCheck,
  UserRound,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Shield,
  UserCog,
  Ban,
  UserCheck,
  Trash2,
} from "lucide-react";

import api from "../../services/api";

export default function ManageUsers() {
  const [users, setUsers] = useState([]);

  const [statistics, setStatistics] = useState({
    totalUsers: 0,
    totalAdmins: 0,
    totalRegularUsers: 0,
  });

  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalUsers: 0,
    limit: 10,
  });

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const [loading, setLoading] = useState(true);
  const [updatingUserId, setUpdatingUserId] = useState(null);

  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // ==========================================
  // FETCH USERS
  // ==========================================

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/admin/users", {
        params: {
          page,
          limit: 10,
          search,
        },
      });

      const result = response.data.data;

      setUsers(result.users || []);

      setStatistics(
        result.statistics || {
          totalUsers: 0,
          totalAdmins: 0,
          totalRegularUsers: 0,
        }
      );

      setPagination(
        result.pagination || {
          currentPage: 1,
          totalPages: 1,
          totalUsers: 0,
          limit: 10,
        }
      );
    } catch (err) {
      console.error("Fetch users error:", err);

      setError(
        err.response?.data?.message ||
          "Unable to load users. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchUsers();
    }, 350);

    return () => clearTimeout(timer);
  }, [fetchUsers]);

  // ==========================================
  // CHANGE USER ROLE
  // ==========================================

  const handleRoleChange = async (user) => {
    const newRole = user.role === "admin" ? "user" : "admin";

    const action = newRole === "admin" ? "promote" : "demote";

    const confirmed = window.confirm(
      `Are you sure you want to ${action} ${user.name} ${
        newRole === "admin"
          ? "to administrator"
          : "to a regular user"
      }?`
    );

    if (!confirmed) return;

    try {
      setUpdatingUserId(user._id);
      setError("");
      setSuccessMessage("");

      const response = await api.patch(
        `/admin/users/${user._id}/role`,
        {
          role: newRole,
        }
      );

      setSuccessMessage(
        response.data.message || "User role updated successfully."
      );

      await fetchUsers();
    } catch (err) {
      console.error("Update user role error:", err);

      setError(
        err.response?.data?.message ||
          "Unable to update user role. Please try again."
      );
    } finally {
      setUpdatingUserId(null);
    }
  };

  // ==========================================
  // SUSPEND USER
  // ==========================================

  const handleSuspendUser = async (user) => {
    if (user.role === "admin") {
      setError("Administrator accounts cannot be suspended here.");
      return;
    }

    const reason = window.prompt(
      `Enter the reason for suspending ${user.name}:`
    );

    // Cancelled or empty reason.
    if (reason === null || !reason.trim()) {
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to suspend ${user.name}?`
    );

    if (!confirmed) return;

    try {
      setUpdatingUserId(user._id);
      setError("");
      setSuccessMessage("");

      const response = await api.patch(
        `/admin/users/${user._id}/status`,
        {
          isSuspended: true,
          reason: reason.trim(),
        }
      );

      setSuccessMessage(
        response.data.message || "User suspended successfully."
      );

      await fetchUsers();
    } catch (err) {
      console.error("Suspend user error:", err);

      setError(
        err.response?.data?.message ||
          "Unable to suspend this user. Please try again."
      );
    } finally {
      setUpdatingUserId(null);
    }
  };

  // ==========================================
  // REACTIVATE USER
  // ==========================================

  const handleReactivateUser = async (user) => {
    const confirmed = window.confirm(
      `Are you sure you want to reactivate ${user.name}'s account?`
    );

    if (!confirmed) return;

    try {
      setUpdatingUserId(user._id);
      setError("");
      setSuccessMessage("");

      const response = await api.patch(
        `/admin/users/${user._id}/status`,
        {
          isSuspended: false,
        }
      );

      setSuccessMessage(
        response.data.message || "User account reactivated successfully."
      );

      await fetchUsers();
    } catch (err) {
      console.error("Reactivate user error:", err);

      setError(
        err.response?.data?.message ||
          "Unable to reactivate this user. Please try again."
      );
    } finally {
      setUpdatingUserId(null);
    }
  };

  // ==========================================
  // PERMANENTLY DELETE USER
  // ==========================================

  const handleDeleteUser = async (user) => {
    if (user.role === "admin") {
      setError("Administrator accounts cannot be deleted here.");
      return;
    }

    const confirmed = window.confirm(
      `WARNING: Are you sure you want to permanently delete ${user.name}'s account?\n\nThis action cannot be undone.`
    );

    if (!confirmed) return;

    try {
      setUpdatingUserId(user._id);
      setError("");
      setSuccessMessage("");

      const response = await api.delete(
        `/admin/users/${user._id}`
      );

      setSuccessMessage(
        response.data.message || "User account deleted successfully."
      );

      // If the last user on this page was deleted,
      // move back to the previous page when possible.
      if (users.length === 1 && page > 1) {
        setPage((previous) => previous - 1);
      } else {
        await fetchUsers();
      }
    } catch (err) {
      console.error("Delete user error:", err);

      setError(
        err.response?.data?.message ||
          "Unable to delete this user. Please try again."
      );
    } finally {
      setUpdatingUserId(null);
    }
  };

  // ==========================================
  // SEARCH
  // ==========================================

  const handleSearch = (event) => {
    setSearch(event.target.value);
    setPage(1);
    setSuccessMessage("");
  };

  // ==========================================
  // DATE FORMAT
  // ==========================================

  const formatDate = (date) => {
    if (!date) return "Not available";

    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // ==========================================
  // STATISTICS CARD
  // ==========================================

  const statCards = [
    {
      title: "Total Users",
      value: statistics.totalUsers,
      icon: Users,
      description: "All registered accounts",
    },
    {
      title: "Administrators",
      value: statistics.totalAdmins,
      icon: ShieldCheck,
      description: "Accounts with admin access",
    },
    {
      title: "Regular Users",
      value: statistics.totalRegularUsers,
      icon: UserRound,
      description: "Standard user accounts",
    },
  ];

  // ==========================================
  // PAGE UI
  // ==========================================

  return (
    <div className="space-y-7">

      {/* PAGE HEADER */}

      <div>
        <h2 className="text-2xl font-bold text-white">
          Manage Users
        </h2>

        <p className="mt-2 text-sm text-gray-400">
          View registered users, manage administrator privileges,
          suspend accounts and remove users.
        </p>
      </div>

      {/* STATISTICS */}

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {statCards.map((stat) => {
          const Icon = stat.icon;

          return (
            <div
              key={stat.title}
              className="rounded-xl border border-gray-800 bg-[#191a21] p-5"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">
                    {stat.title}
                  </p>

                  <h3 className="mt-2 text-3xl font-bold text-white">
                    {Number(stat.value || 0).toLocaleString()}
                  </h3>
                </div>

                <div className="rounded-xl bg-red-500/10 p-3">
                  <Icon size={25} className="text-red-400" />
                </div>
              </div>

              <p className="mt-3 text-xs text-gray-500">
                {stat.description}
              </p>
            </div>
          );
        })}
      </div>

      {/* SEARCH AND REFRESH */}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-md">
          <Search
            size={19}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500"
          />

          <input
            type="text"
            value={search}
            onChange={handleSearch}
            placeholder="Search by name, username or email..."
            className="w-full rounded-lg border border-gray-800 bg-[#191a21] py-3 pl-11 pr-4 text-sm text-white outline-none transition focus:border-red-500"
          />
        </div>

        <button
          onClick={() => {
            setSuccessMessage("");
            fetchUsers();
          }}
          disabled={loading}
          className="flex items-center justify-center gap-2 rounded-lg border border-gray-700 bg-[#191a21] px-4 py-3 text-sm text-gray-300 transition hover:border-red-500 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          <RefreshCw
            size={16}
            className={loading ? "animate-spin" : ""}
          />

          Refresh
        </button>
      </div>

      {/* SUCCESS MESSAGE */}

      {successMessage && (
        <div className="rounded-lg border border-green-500/30 bg-green-500/10 px-4 py-3 text-sm text-green-400">
          {successMessage}
        </div>
      )}

      {/* ERROR MESSAGE */}

      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {/* USERS TABLE */}

      <div className="overflow-hidden rounded-xl border border-gray-800 bg-[#191a21]">

        <div className="flex flex-col gap-2 border-b border-gray-800 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="font-semibold text-white">
              Registered Users
            </h3>

            <p className="mt-1 text-xs text-gray-500">
              {pagination.totalUsers} matching accounts
            </p>
          </div>

          <span className="text-xs text-gray-500">
            Showing page {pagination.currentPage} of{" "}
            {pagination.totalPages}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1100px] text-left">

            <thead className="bg-[#202127] text-xs uppercase tracking-wider text-gray-400">
              <tr>
                <th className="px-5 py-4">User</th>
                <th className="px-5 py-4">Email</th>
                <th className="px-5 py-4">Role</th>
                <th className="px-5 py-4">Status</th>
                <th className="px-5 py-4">Date Joined</th>
                <th className="px-5 py-4 text-right">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-800">

              {loading ? (
                <tr>
                  <td
                    colSpan="6"
                    className="px-5 py-12 text-center text-sm text-gray-400"
                  >
                    <RefreshCw
                      size={22}
                      className="mx-auto mb-3 animate-spin text-red-400"
                    />

                    Loading users...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td
                    colSpan="6"
                    className="px-5 py-12 text-center text-sm text-gray-400"
                  >
                    No users found.
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr
                    key={user._id}
                    className="transition hover:bg-[#202127]"
                  >

                    {/* USER INFORMATION */}

                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-500/15 text-sm font-bold uppercase text-red-400">
                          {user.name?.charAt(0) || "U"}
                        </div>

                        <div>
                          <p className="font-medium text-white">
                            {user.name || "Unnamed User"}
                          </p>

                          <p className="mt-1 text-xs text-gray-500">
                            @{user.username || "username"}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* EMAIL */}

                    <td className="px-5 py-4 text-sm text-gray-400">
                      {user.email || "No email"}
                    </td>

                    {/* ROLE */}

                    <td className="px-5 py-4">
                      {user.role === "admin" ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-red-500/10 px-3 py-1.5 text-xs font-medium text-red-400">
                          <ShieldCheck size={14} />
                          Administrator
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-500/10 px-3 py-1.5 text-xs font-medium text-blue-400">
                          <UserRound size={14} />
                          Regular User
                        </span>
                      )}
                    </td>

                    {/* ACCOUNT STATUS */}

                    <td className="px-5 py-4">
                      {user.isSuspended ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-yellow-500/10 px-3 py-1.5 text-xs font-medium text-yellow-400">
                          <Ban size={14} />
                          Suspended
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-green-500/10 px-3 py-1.5 text-xs font-medium text-green-400">
                          <UserCheck size={14} />
                          Active
                        </span>
                      )}
                    </td>

                    {/* DATE JOINED */}

                    <td className="px-5 py-4 text-sm text-gray-400">
                      {formatDate(user.createdAt)}
                    </td>

                    {/* ACTIONS */}

                    <td className="px-5 py-4">
                      <div className="flex flex-wrap justify-end gap-2">

                        {/* PROMOTE / DEMOTE */}

                        <button
                          onClick={() => handleRoleChange(user)}
                          disabled={updatingUserId === user._id}
                          title={
                            user.role === "admin"
                              ? "Demote user"
                              : "Promote user"
                          }
                          className={`inline-flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs font-medium transition disabled:cursor-not-allowed disabled:opacity-50 ${
                            user.role === "admin"
                              ? "bg-gray-700 text-gray-200 hover:bg-gray-600"
                              : "bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white"
                          }`}
                        >
                          {user.role === "admin" ? (
                            <>
                              <UserCog size={14} />
                              Demote
                            </>
                          ) : (
                            <>
                              <Shield size={14} />
                              Promote
                            </>
                          )}
                        </button>

                        {/* SUSPEND / REACTIVATE */}

                        {user.role !== "admin" && (
                          <button
                            onClick={() =>
                              user.isSuspended
                                ? handleReactivateUser(user)
                                : handleSuspendUser(user)
                            }
                            disabled={updatingUserId === user._id}
                            title={
                              user.isSuspended
                                ? "Reactivate account"
                                : "Suspend account"
                            }
                            className={`inline-flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs font-medium transition disabled:cursor-not-allowed disabled:opacity-50 ${
                              user.isSuspended
                                ? "bg-green-500/10 text-green-400 hover:bg-green-500 hover:text-white"
                                : "bg-yellow-500/10 text-yellow-400 hover:bg-yellow-500 hover:text-white"
                            }`}
                          >
                            {user.isSuspended ? (
                              <>
                                <UserCheck size={14} />
                                Reactivate
                              </>
                            ) : (
                              <>
                                <Ban size={14} />
                                Suspend
                              </>
                            )}
                          </button>
                        )}

                        {/* PERMANENT DELETE */}

                        {user.role !== "admin" && (
                          <button
                            onClick={() => handleDeleteUser(user)}
                            disabled={updatingUserId === user._id}
                            title="Permanently delete account"
                            className="inline-flex items-center justify-center gap-2 rounded-lg bg-red-500/10 px-3 py-2 text-xs font-medium text-red-400 transition hover:bg-red-500 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            <Trash2 size={14} />
                            Delete
                          </button>
                        )}

                        {/* LOADING INDICATOR */}

                        {updatingUserId === user._id && (
                          <RefreshCw
                            size={16}
                            className="animate-spin text-red-400"
                          />
                        )}

                      </div>
                    </td>

                  </tr>
                ))
              )}

            </tbody>
          </table>
        </div>

        {/* PAGINATION */}

        <div className="flex flex-col gap-3 border-t border-gray-800 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">

          <p className="text-xs text-gray-500">
            Page {pagination.currentPage} of {pagination.totalPages}
          </p>

          <div className="flex items-center gap-2">

            <button
              onClick={() =>
                setPage((previous) => Math.max(1, previous - 1))
              }
              disabled={page <= 1 || loading}
              className="flex items-center gap-1 rounded-lg border border-gray-700 px-3 py-2 text-xs text-gray-300 transition hover:border-red-500 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronLeft size={15} />
              Previous
            </button>

            <button
              onClick={() =>
                setPage((previous) =>
                  Math.min(pagination.totalPages, previous + 1)
                )
              }
              disabled={
                page >= pagination.totalPages || loading
              }
              className="flex items-center gap-1 rounded-lg border border-gray-700 px-3 py-2 text-xs text-gray-300 transition hover:border-red-500 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Next
              <ChevronRight size={15} />
            </button>

          </div>
        </div>

      </div>
    </div>
  );
}

