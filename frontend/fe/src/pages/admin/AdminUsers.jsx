import { useState, useEffect, useCallback } from "react";
import {
  Search,
  ShieldCheck,
  User,
  Truck,
  UserCheck,
  ToggleLeft,
  ToggleRight,
  Loader2,
  X,
} from "lucide-react";
import { getToken } from "../../services/api";
import { formatDate } from "../../utils/formatters";
import toast from "react-hot-toast";

const API_URL = import.meta.env.VITE_API_URL;

const ROLE_CONFIG = {
  customer: {
    label: "Customer",
    color: "bg-blue-50 text-blue-700 border-blue-200",
    icon: User,
  },
  driver: {
    label: "Driver",
    color: "bg-green-50 text-green-700 border-green-200",
    icon: Truck,
  },
  staff: {
    label: "Staff",
    color: "bg-orange-50 text-orange-700 border-orange-200",
    icon: UserCheck,
  },
  admin: {
    label: "Admin",
    color: "bg-gray-900 text-white border-gray-700",
    icon: ShieldCheck,
  },
};

const RoleBadge = ({ role }) => {
  const cfg = ROLE_CONFIG[role];
  if (!cfg) return null;
  const Icon = cfg.icon;
  return (
    <span
      className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full border ${cfg.color}`}
    >
      <Icon className="w-3 h-3" /> {cfg.label}
    </span>
  );
};

// Confirmation modal
const ConfirmModal = ({ message, onConfirm, onCancel, loading }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
    <div className="bg-white border border-gray-200 rounded-2xl p-6 max-w-sm w-full shadow-xl">
      <p className="text-gray-900 font-medium mb-6 text-center">{message}</p>
      <div className="flex gap-3">
        <button
          onClick={onCancel}
          disabled={loading}
          className="flex-1 py-2.5 border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 transition-colors text-sm font-medium"
        >
          Cancel
        </button>
        <button
          onClick={onConfirm}
          disabled={loading}
          className="flex-1 py-2.5 bg-gray-900 hover:bg-gray-700 rounded-xl text-white transition-colors text-sm font-medium flex items-center justify-center gap-2"
        >
          {loading && <Loader2 className="w-4 h-4 animate-spin" />}
          Confirm
        </button>
      </div>
    </div>
  </div>
);

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // Per-action loading states keyed by `${userId}_${action}`
  const [actionLoading, setActionLoading] = useState({});

  // Confirm modal
  const [confirm, setConfirm] = useState(null); // { message, onConfirm }

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({ page, limit: 15 });
      if (search) params.append("search", search);
      const res = await fetch(`${API_URL}/admin/users?${params}`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "Unable to load user list");
      setUsers(json.data || []);
      setTotal(json.total || 0);
      setTotalPages(json.totalPages || 1);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleSearch = (e) => {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1);
  };

  const updateRole = async (userId, role, action) => {
    const key = `${userId}_${role}_${action}`;
    setActionLoading((prev) => ({ ...prev, [key]: true }));
    try {
      const res = await fetch(`${API_URL}/admin/users/${userId}/role`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({ role, action }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "Operation failed");
      // Update locally
      setUsers((prev) =>
        prev.map((u) => (u._id === userId ? { ...u, roles: json.roles } : u)),
      );
      toast.success(json.message || "Role updated successfully");
    } catch (err) {
      toast.error(err.message);
    } finally {
      setActionLoading((prev) => ({ ...prev, [key]: false }));
      setConfirm(null);
    }
  };

  const toggleStatus = async (userId) => {
    const key = `${userId}_status`;
    setActionLoading((prev) => ({ ...prev, [key]: true }));
    try {
      const res = await fetch(`${API_URL}/admin/users/${userId}/status`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "Operation failed");
      setUsers((prev) =>
        prev.map((u) =>
          u._id === userId ? { ...u, is_active: json.is_active } : u,
        ),
      );
      toast.success(json.message || "Status updated successfully");
    } catch (err) {
      toast.error(err.message);
    } finally {
      setActionLoading((prev) => ({ ...prev, [key]: false }));
      setConfirm(null);
    }
  };

  const askConfirm = (message, onConfirm) => {
    setConfirm({ message, onConfirm });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
          <p className="text-gray-500 text-sm mt-1">
            View and edit roles • {total} users
          </p>
        </div>

        <form onSubmit={handleSearch} className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search name, email, phone..."
              className="bg-white border border-gray-200 text-gray-900 placeholder-gray-400 rounded-xl pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400 w-64"
            />
            {searchInput && (
              <button
                type="button"
                onClick={() => {
                  setSearchInput("");
                  setSearch("");
                  setPage(1);
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <button
            type="submit"
            className="bg-gray-900 hover:bg-gray-700 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-colors"
          >
            Search
          </button>
        </form>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-5 py-4 rounded-xl">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center py-24">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-gray-800" />
        </div>
      ) : users.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-2xl p-16 text-center">
          <User className="mx-auto mb-4 text-gray-300" size={48} />
          <p className="text-gray-500">No users found</p>
        </div>
      ) : (
        <>
          <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wide">
                  <tr>
                    <th className="px-5 py-4">User</th>
                    <th className="px-5 py-4">Roles</th>
                    <th className="px-5 py-4">Created At</th>
                    <th className="px-5 py-4">Status</th>
                    <th className="px-5 py-4">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {users.map((u) => {
                    const statusKey = `${u._id}_status`;
                    return (
                      <tr
                        key={u._id}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        {/* User info */}
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            {u.avatar_url ? (
                              <img
                                src={u.avatar_url}
                                alt=""
                                className="w-9 h-9 rounded-full object-cover flex-shrink-0"
                              />
                            ) : (
                              <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                                <User className="w-4 h-4 text-gray-400" />
                              </div>
                            )}
                            <div>
                              <div className="font-medium text-gray-900">
                                {u.full_name}
                              </div>
                              <div className="text-xs text-gray-500">
                                {u.email}
                              </div>
                              <div className="text-xs text-gray-400">
                                {u.phone}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Roles */}
                        <td className="px-5 py-4">
                          <div className="flex flex-wrap gap-1.5">
                            {u.roles.length > 0 ? (
                              u.roles.map((r) => <RoleBadge key={r} role={r} />)
                            ) : (
                              <span className="text-xs text-gray-400">
                                — no roles
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Created */}
                        <td className="px-5 py-4 text-gray-500 text-xs whitespace-nowrap">
                          {formatDate(u.createdAt)}
                        </td>

                        {/* Status */}
                        <td className="px-5 py-4">
                          <button
                            onClick={() =>
                              askConfirm(
                                `${u.is_active ? "Deactivate" : "Activate"} account "${u.full_name}"?`,
                                () => toggleStatus(u._id),
                              )
                            }
                            disabled={actionLoading[statusKey]}
                            className="flex items-center gap-1.5 text-xs font-medium hover:opacity-80 transition-opacity disabled:opacity-50"
                          >
                            {actionLoading[statusKey] ? (
                              <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                            ) : u.is_active ? (
                              <>
                                <ToggleRight className="w-5 h-5 text-green-500" />
                                <span className="text-green-600">Active</span>
                              </>
                            ) : (
                              <>
                                <ToggleLeft className="w-5 h-5 text-gray-300" />
                                <span className="text-gray-400">Inactive</span>
                              </>
                            )}
                          </button>
                        </td>

                        {/* Role actions */}
                        <td className="px-5 py-4">
                          <div className="flex flex-wrap gap-2">
                            {/* Staff toggle */}
                            {u.roles.includes("staff") ? (
                              <button
                                onClick={() =>
                                  askConfirm(
                                    `Remove Staff role from "${u.full_name}"?`,
                                    () => updateRole(u._id, "staff", "remove"),
                                  )
                                }
                                disabled={
                                  actionLoading[`${u._id}_staff_remove`]
                                }
                                className="flex items-center gap-1 text-xs px-2.5 py-1.5 bg-orange-50 text-orange-700 border border-orange-200 rounded-lg hover:bg-orange-100 transition-colors disabled:opacity-50"
                              >
                                {actionLoading[`${u._id}_staff_remove`] && (
                                  <Loader2 className="w-3 h-3 animate-spin" />
                                )}
                                <UserCheck className="w-3 h-3" /> − Staff
                              </button>
                            ) : (
                              <button
                                onClick={() =>
                                  askConfirm(
                                    `Add Staff role to "${u.full_name}"?`,
                                    () => updateRole(u._id, "staff", "add"),
                                  )
                                }
                                disabled={actionLoading[`${u._id}_staff_add`]}
                                className="flex items-center gap-1 text-xs px-2.5 py-1.5 bg-gray-100 text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
                              >
                                {actionLoading[`${u._id}_staff_add`] && (
                                  <Loader2 className="w-3 h-3 animate-spin" />
                                )}
                                <UserCheck className="w-3 h-3" /> + Staff
                              </button>
                            )}

                            {/* Admin toggle */}
                            {u.roles.includes("admin") ? (
                              <button
                                onClick={() =>
                                  askConfirm(
                                    `Remove Admin role from "${u.full_name}"?`,
                                    () => updateRole(u._id, "admin", "remove"),
                                  )
                                }
                                disabled={
                                  actionLoading[`${u._id}_admin_remove`]
                                }
                                className="flex items-center gap-1 text-xs px-2.5 py-1.5 bg-gray-900 text-white border border-gray-700 rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50"
                              >
                                {actionLoading[`${u._id}_admin_remove`] && (
                                  <Loader2 className="w-3 h-3 animate-spin" />
                                )}
                                <ShieldCheck className="w-3 h-3" /> − Admin
                              </button>
                            ) : (
                              <button
                                onClick={() =>
                                  askConfirm(
                                    `Grant Admin role to "${u.full_name}"?`,
                                    () => updateRole(u._id, "admin", "add"),
                                  )
                                }
                                disabled={actionLoading[`${u._id}_admin_add`]}
                                className="flex items-center gap-1 text-xs px-2.5 py-1.5 bg-gray-100 text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
                              >
                                {actionLoading[`${u._id}_admin_add`] && (
                                  <Loader2 className="w-3 h-3 animate-spin" />
                                )}
                                <ShieldCheck className="w-3 h-3" /> + Admin
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-3">
              <button
                disabled={page === 1}
                onClick={() => setPage((p) => p - 1)}
                className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-40 transition-colors"
              >
                Previous
              </button>
              <span className="text-sm text-gray-500 font-medium">
                Page {page} / {totalPages}
              </span>
              <button
                disabled={page === totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-40 transition-colors"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}

      {/* Confirm modal */}
      {confirm && (
        <ConfirmModal
          message={confirm.message}
          onConfirm={confirm.onConfirm}
          onCancel={() => setConfirm(null)}
          loading={Object.values(actionLoading).some(Boolean)}
        />
      )}
    </div>
  );
};

export default AdminUsers;
