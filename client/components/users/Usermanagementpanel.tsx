"use client";

import { useEffect, useMemo, useState } from "react";
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
    <div className="userManagementPanel animate-fadeIn">
      <div className="userPanelHeader">
        <div className="userPanelHeader__left">
          <div className="userPanelHeader__icon">
            <Shield size={24} strokeWidth={2.5} />
          </div>
          <div className="userPanelHeader__title">
            <h1>User Management</h1>
            <p>Control and manage system users</p>
          </div>
        </div>

        <div className="userPanelHeader__actions">
          <button
            type="button"
            onClick={() => setInviteOpen(true)}
            className="addUserBtn"
          >
            <UserPlus size={18} strokeWidth={2.5} />
            <span>Add User</span>
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

      <div className="userSearch group">
        <Search className="userSearch__icon" />
        <input
          type="text"
          placeholder="Search for any user by name or email address..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="userSearch__input"
        />
      </div>

      <div className="userGridWrapper">
        {loading ? (
          <div className="loaderWrapper">
            <div className="loaderWrapper__spinner" />
            <p>Fetching secure user data...</p>
          </div>
        ) : error ? (
          <div className="errorWrapper">
            <div className="errorWrapper__icon">
              <Shield size={32} />
            </div>
            <div>
              <p className="errorWrapper__title">Request Failed</p>
              <p className="errorWrapper__message">{error}</p>
            </div>
            <button 
              type="button" 
              onClick={refreshRows} 
              className="addUserBtn"
              style={{ background: '#0f172a' }}
            >
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