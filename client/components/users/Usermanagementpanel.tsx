"use client";

import { useEffect, useMemo, useState } from "react";
import { type SortColumn } from "react-data-grid";
import { Search, Shield, UserPlus } from "lucide-react";
import { EditForm, UserRow } from "@appTypes/index";
import UserDetailPanel from "./UserDetailPanel";
import UserGrid from "./UserGrid";
import InviteUserModal from "./InviteUserModal";
import EditUserModal from "./EditUserModal";
import DeleteConfirmModal from "./DeleteConfirmModal";
import BulkActions from "./BulkActions";
import { useUsers } from "./useUsers";

export default function UserManagementPanel() {
  const {
    loading,
    error,
    search,
    setSearch,
    sortColumns,
    setSortColumns,
    filter,
    setFilter,
    filteredRows,
    summaryRows,
    refreshRows,
    deleteUser,
    bulkDeleteUsers,
    updateUser,
  } = useUsers();

  const [selectedRows, setSelectedRows] = useState<ReadonlySet<string>>(new Set());
  const [editUser, setEditUser] = useState<UserRow | null>(null);
  const [editForm, setEditForm] = useState<EditForm>({ username: "", email: "" });
  const [editLoading, setEditLoading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [bulkDeleteConfirm, setBulkDeleteConfirm] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [detailUser, setDetailUser] = useState<UserRow | null>(null);

  const visibleIds = useMemo(() => new Set(filteredRows.map((r) => r._id)), [filteredRows]);

  useEffect(() => {
    // Keep selection consistent with current filters/search.
    // Bulk actions should only apply to visible (filtered) users.
    setSelectedRows((prev) => {
      if (prev.size === 0) return prev;
      const next = new Set<string>();
      prev.forEach((id) => {
        if (visibleIds.has(id)) next.add(id);
      });
      return next;
    });
  }, [visibleIds]);

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    const success = await deleteUser(deleteTarget);
    if (success) {
      if (detailUser?._id === deleteTarget) setDetailUser(null);
    }
    setDeleteTarget(null);
  };

  const handleConfirmBulkDelete = async () => {
    const ids = [...selectedRows];
    const success = await bulkDeleteUsers(ids);
    if (success) {
      setSelectedRows(new Set());
    }
    setBulkDeleteConfirm(false);
  };

  const handleSaveEdit = async () => {
    if (!editUser) return;
    setEditLoading(true);
    const success = await updateUser(editUser._id, editForm);
    if (success) {
      setEditUser(null);
    }
    setEditLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-zinc-950 p-6 flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-violet-600/10 dark:bg-violet-600/20 rounded-2xl">
            <Shield className="w-6 h-6 text-violet-600 dark:text-violet-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">User Management</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Control and manage system users</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setInviteOpen(true)}
            className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-2xl bg-violet-600 hover:bg-violet-700 text-white shadow-lg shadow-violet-600/20 transition-all active:scale-95"
          >
            <UserPlus className="w-4 h-4" />
            Add User
          </button>

          <BulkActions
            selectedCount={selectedRows.size}
            onDeleteSelected={() => setBulkDeleteConfirm(true)}
            onClearSelection={() => setSelectedRows(new Set())}
            filter={filter}
            onChangeFilter={setFilter}
            onResetFilter={() => setFilter({ role: "all", status: "all", boards: "all", tasks: "all", joined: "all" })}
          />
        </div>
      </div>

      <div className="relative group">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-gray-400 group-focus-within:text-violet-500 transition-colors" />
        <input
          type="text"
          placeholder="Search for any user by name or email address..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-11 pr-4 py-3.5 text-sm rounded-2xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-gray-800 dark:text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all shadow-sm"
        />
      </div>

      <div className="flex-1 min-h-0">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-64 gap-4 text-gray-400">
            <div className="w-10 h-10 border-3 border-gray-200 border-t-violet-600 rounded-full animate-spin" />
            <p className="text-sm font-medium">Fetching secure user data...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center h-64 gap-4 text-center p-6 bg-red-50 dark:bg-red-900/10 rounded-3xl border border-red-100 dark:border-red-900/20">
            <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-2xl"><Shield className="w-6 h-6 text-red-600 dark:text-red-400" /></div>
            <div>
              <p className="font-bold text-gray-900 dark:text-white">Request Failed</p>
              <p className="text-sm text-red-500 dark:text-red-400 mt-1">{error}</p>
            </div>
            <button type="button" onClick={refreshRows} className="mt-2 px-6 py-2.5 text-sm font-bold rounded-xl bg-gray-900 dark:bg-white text-white dark:text-zinc-950 hover:opacity-90 transition-all active:scale-95">
              Try Again
            </button>
          </div>
        ) : (
          <UserGrid
            rows={filteredRows}
            summaryRows={summaryRows}
            sortColumns={sortColumns}
            onSortColumnsChange={setSortColumns}
            selectedRows={selectedRows}
            onSelectedRowsChange={setSelectedRows}
            onViewDetail={setDetailUser}
            onEdit={(user) => {
              setEditUser(user);
              setEditForm({ username: user.username, email: user.email });
            }}
            onDelete={setDeleteTarget}
          />
        )}
      </div>

      {detailUser && (
        <UserDetailPanel
          user={detailUser}
          onClose={() => setDetailUser(null)}
          onEdit={() => {
            setEditUser(detailUser);
            setEditForm({ username: detailUser.username, email: detailUser.email });
            setDetailUser(null);
          }}
          onDelete={() => {
            setDeleteTarget(detailUser._id);
            setDetailUser(null);
          }}
        />
      )}

      <InviteUserModal 
        isOpen={inviteOpen} 
        onClose={() => setInviteOpen(false)} 
        onSuccess={refreshRows}
      />

      <EditUserModal
        user={editUser}
        form={editForm}
        isLoading={editLoading}
        onChange={setEditForm}
        onSave={handleSaveEdit}
        onClose={() => setEditUser(null)}
      />

      <DeleteConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
        title="Delete User Account"
        message="Are you sure you want to delete this user? All associated data will be permanently removed. This action cannot be undone."
      />

      <DeleteConfirmModal
        isOpen={bulkDeleteConfirm}
        onClose={() => setBulkDeleteConfirm(false)}
        onConfirm={handleConfirmBulkDelete}
        title={`Delete ${selectedRows.size} Users`}
        message={`You are about to permanently delete ${selectedRows.size} selected user accounts. This action is irreversible and will remove all their data from the system.`}
      />
    </div>
  );
}