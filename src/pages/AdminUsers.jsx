import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { useAuth } from "@configs/AuthProvider";
import { authApi } from "@services/auth/auth-apis";
import {
  MagnifyingGlassIcon,
  UserGroupIcon,
  ShieldCheckIcon,
  XMarkIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  XCircleIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "@heroicons/react/24/outline";

export default function AdminUsers() {
  const { t } = useTranslation();
  const { accessToken, user: currentUser } = useAuth();

  // State
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const pageSize = 10;

  // Modal state
  const [selectedUser, setSelectedUser] = useState(null);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showRevokeModal, setShowRevokeModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Fetch users
  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const response = await authApi.listUsers(accessToken, {
        page,
        pageSize,
        search: search || undefined,
        role: roleFilter || undefined,
        isActive: statusFilter === "" ? undefined : statusFilter === "active",
      });

      setUsers(response.data.users);
      setTotal(response.data.total);
      setTotalPages(Math.ceil(response.data.total / pageSize));
    } catch (error) {
      console.error("Failed to fetch users:", error);
      toast.error(t("Failed to load users"));
    } finally {
      setLoading(false);
    }
  }, [accessToken, page, search, roleFilter, statusFilter, t]);

  useEffect(() => {
    document.title = `${t("User Management")} - Admin`;
    fetchUsers();
  }, [fetchUsers, t]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      fetchUsers();
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Handle role update
  const handleUpdateRole = async (newRole) => {
    if (!selectedUser) return;

    try {
      setActionLoading(true);
      await authApi.updateUserRole(accessToken, selectedUser.uuid, newRole);
      toast.success(t("Role updated successfully"));
      setShowRoleModal(false);
      fetchUsers();
    } catch (error) {
      toast.error(error.response?.data?.detail || t("Failed to update role"));
    } finally {
      setActionLoading(false);
    }
  };

  // Handle status update
  const handleUpdateStatus = async () => {
    if (!selectedUser) return;

    try {
      setActionLoading(true);
      await authApi.updateUserStatus(accessToken, selectedUser.uuid, !selectedUser.is_active);
      toast.success(selectedUser.is_active ? t("User deactivated") : t("User activated"));
      setShowStatusModal(false);
      fetchUsers();
    } catch (error) {
      toast.error(error.response?.data?.detail || t("Failed to update status"));
    } finally {
      setActionLoading(false);
    }
  };

  // Handle revoke sessions
  const handleRevokeSessions = async () => {
    if (!selectedUser) return;

    try {
      setActionLoading(true);
      await authApi.revokeUserSessions(accessToken, selectedUser.uuid);
      toast.success(t("All sessions revoked"));
      setShowRevokeModal(false);
    } catch (error) {
      toast.error(error.response?.data?.detail || t("Failed to revoke sessions"));
    } finally {
      setActionLoading(false);
    }
  };

  // Format date
  const formatDate = (dateStr) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString("vi-VN", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3 mb-2">
            <UserGroupIcon className="w-8 h-8 text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {t("User Management")}
            </h1>
          </div>
          <p className="text-gray-600 dark:text-gray-400">
            {t("Manage user accounts and permissions")}
          </p>
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 mb-6"
        >
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder={t("Search by name or email...")}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Role Filter */}
            <select
              value={roleFilter}
              onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="">{t("All Roles")}</option>
              <option value="admin">{t("Admin")}</option>
              <option value="user">{t("User")}</option>
            </select>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="">{t("All Status")}</option>
              <option value="active">{t("Active")}</option>
              <option value="inactive">{t("Inactive")}</option>
            </select>

            {/* Refresh */}
            <button
              onClick={fetchUsers}
              disabled={loading}
              className="px-4 py-2 text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              <ArrowPathIcon className={`w-5 h-5 ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="mb-4 text-sm text-gray-600 dark:text-gray-400"
        >
          {t("Total")}: <span className="font-semibold">{total}</span> {t("users")}
        </motion.div>

        {/* Users Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden"
        >
          {loading ? (
            <div className="p-8 text-center">
              <ArrowPathIcon className="w-8 h-8 animate-spin mx-auto text-blue-600" />
              <p className="mt-2 text-gray-600 dark:text-gray-400">{t("Loading...")}</p>
            </div>
          ) : users.length === 0 ? (
            <div className="p-8 text-center">
              <UserGroupIcon className="w-12 h-12 mx-auto text-gray-400" />
              <p className="mt-2 text-gray-600 dark:text-gray-400">{t("No users found")}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      {t("User")}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      {t("Role")}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      {t("Status")}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      {t("Last Login")}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      {t("Logins")}
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      {t("Actions")}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {users.map((user) => (
                    <tr key={user.uuid} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white font-semibold text-sm">
                            {user.full_name?.split(' ').map(n => n.charAt(0)).join('').slice(0, 2).toUpperCase() || "U"}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">
                              {user.full_name}
                              {user.uuid === currentUser?.uuid && (
                                <span className="ml-2 text-xs text-blue-600 dark:text-blue-400">({t("You")})</span>
                              )}
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          user.role === "admin"
                            ? "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300"
                            : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                        }`}>
                          {user.role === "admin" && <ShieldCheckIcon className="w-3 h-3" />}
                          {user.role === "admin" ? t("Admin") : t("User")}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          user.is_active
                            ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300"
                            : "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300"
                        }`}>
                          {user.is_active ? (
                            <>
                              <CheckCircleIcon className="w-3 h-3" />
                              {t("Active")}
                            </>
                          ) : (
                            <>
                              <XCircleIcon className="w-3 h-3" />
                              {t("Inactive")}
                            </>
                          )}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {formatDate(user.last_login_at)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {user.login_count || 0}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => { setSelectedUser(user); setShowRoleModal(true); }}
                            disabled={user.uuid === currentUser?.uuid}
                            className="px-3 py-1.5 text-xs font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {t("Role")}
                          </button>
                          <button
                            onClick={() => { setSelectedUser(user); setShowStatusModal(true); }}
                            disabled={user.uuid === currentUser?.uuid}
                            className="px-3 py-1.5 text-xs font-medium text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {user.is_active ? t("Deactivate") : t("Activate")}
                          </button>
                          <button
                            onClick={() => { setSelectedUser(user); setShowRevokeModal(true); }}
                            className="px-3 py-1.5 text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                          >
                            {t("Revoke")}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {t("Page")} {page} / {totalPages}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeftIcon className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRightIcon className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </div>

      {/* Role Modal */}
      <AnimatePresence>
        {showRoleModal && selectedUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
              onClick={() => setShowRoleModal(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 w-full max-w-md"
            >
              <button
                onClick={() => setShowRoleModal(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>

              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                {t("Change Role")}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                {t("Update role for")} <strong>{selectedUser.full_name}</strong>
              </p>

              <div className="space-y-3">
                <button
                  onClick={() => handleUpdateRole("user")}
                  disabled={actionLoading || selectedUser.role === "user"}
                  className={`w-full p-4 rounded-xl border-2 transition-all flex items-center gap-3 ${
                    selectedUser.role === "user"
                      ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                      : "border-gray-200 dark:border-gray-600 hover:border-blue-300"
                  } disabled:opacity-50`}
                >
                  <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                    <UserGroupIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                  </div>
                  <div className="text-left">
                    <p className="font-medium text-gray-900 dark:text-white">{t("User")}</p>
                    <p className="text-xs text-gray-500">{t("Standard user permissions")}</p>
                  </div>
                  {selectedUser.role === "user" && (
                    <CheckCircleIcon className="w-5 h-5 text-blue-600 ml-auto" />
                  )}
                </button>

                <button
                  onClick={() => handleUpdateRole("admin")}
                  disabled={actionLoading || selectedUser.role === "admin"}
                  className={`w-full p-4 rounded-xl border-2 transition-all flex items-center gap-3 ${
                    selectedUser.role === "admin"
                      ? "border-purple-500 bg-purple-50 dark:bg-purple-900/20"
                      : "border-gray-200 dark:border-gray-600 hover:border-purple-300"
                  } disabled:opacity-50`}
                >
                  <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                    <ShieldCheckIcon className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div className="text-left">
                    <p className="font-medium text-gray-900 dark:text-white">{t("Admin")}</p>
                    <p className="text-xs text-gray-500">{t("Full administrative access")}</p>
                  </div>
                  {selectedUser.role === "admin" && (
                    <CheckCircleIcon className="w-5 h-5 text-purple-600 ml-auto" />
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Status Modal */}
      <AnimatePresence>
        {showStatusModal && selectedUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
              onClick={() => setShowStatusModal(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 w-full max-w-md"
            >
              <div className="text-center">
                <div className={`w-12 h-12 mx-auto mb-4 rounded-full flex items-center justify-center ${
                  selectedUser.is_active
                    ? "bg-amber-100 dark:bg-amber-900/30"
                    : "bg-green-100 dark:bg-green-900/30"
                }`}>
                  {selectedUser.is_active ? (
                    <XCircleIcon className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                  ) : (
                    <CheckCircleIcon className="w-6 h-6 text-green-600 dark:text-green-400" />
                  )}
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  {selectedUser.is_active ? t("Deactivate User") : t("Activate User")}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                  {selectedUser.is_active
                    ? t("This user will no longer be able to access the system.")
                    : t("This user will be able to access the system again.")}
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowStatusModal(false)}
                    className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
                  >
                    {t("Cancel")}
                  </button>
                  <button
                    onClick={handleUpdateStatus}
                    disabled={actionLoading}
                    className={`flex-1 px-4 py-2.5 text-sm font-medium text-white rounded-lg transition-colors disabled:opacity-50 ${
                      selectedUser.is_active
                        ? "bg-amber-600 hover:bg-amber-700"
                        : "bg-green-600 hover:bg-green-700"
                    }`}
                  >
                    {actionLoading ? t("Processing...") : (selectedUser.is_active ? t("Deactivate") : t("Activate"))}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Revoke Sessions Modal */}
      <AnimatePresence>
        {showRevokeModal && selectedUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
              onClick={() => setShowRevokeModal(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 w-full max-w-md"
            >
              <div className="text-center">
                <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                  <ArrowPathIcon className="w-6 h-6 text-red-600 dark:text-red-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  {t("Revoke All Sessions")}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                  {t("This will force")} <strong>{selectedUser.full_name}</strong> {t("to log in again on all devices.")}
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowRevokeModal(false)}
                    className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
                  >
                    {t("Cancel")}
                  </button>
                  <button
                    onClick={handleRevokeSessions}
                    disabled={actionLoading}
                    className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors disabled:opacity-50"
                  >
                    {actionLoading ? t("Processing...") : t("Revoke Sessions")}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
