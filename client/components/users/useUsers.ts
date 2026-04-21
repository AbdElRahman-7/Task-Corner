import { useState, useEffect, useMemo, useCallback } from "react";
import { type SortColumn } from "react-data-grid";
import { UserRow, EditForm } from "@appTypes/index";
import { API, authHeaders } from "./userConfig";

export type UsersBulkFilter = {
  role: "all" | "admin" | "user";
  status: "all" | "active" | "disabled";
  boards: "all" | "with" | "without";
  tasks: "all" | "with" | "without";
  joined: "all" | "7d" | "30d" | "90d";
};

const DEFAULT_FILTER: UsersBulkFilter = {
  role: "all",
  status: "all",
  boards: "all",
  tasks: "all",
  joined: "all",
};

export function useUsers() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [sortColumns, setSortColumns] = useState<readonly SortColumn[]>([]);
  const [filter, setFilter] = useState<UsersBulkFilter>(DEFAULT_FILTER);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API}/api/admin/users`, { headers: authHeaders() });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      setUsers(data.users);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load users");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const deleteUser = async (id: string) => {
    try {
      const res = await fetch(`${API}/api/admin/users/${id}`, {
        method: "DELETE",
        headers: authHeaders(),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      setUsers((prev) => prev.filter((u) => u._id !== id));
      return true;
    } catch (err) {
      console.error("Delete user failed:", err);
      return false;
    }
  };

  const bulkDeleteUsers = async (ids: string[]) => {
    try {
      const res = await fetch(`${API}/api/admin/users/bulk`, {
        method: "DELETE",
        headers: authHeaders(),
        body: JSON.stringify({ ids }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      setUsers((prev) => prev.filter((u) => !ids.includes(u._id)));
      return true;
    } catch (err) {
      console.error("Bulk delete failed:", err);
      return false;
    }
  };

  const updateUser = async (id: string, form: EditForm) => {
    try {
      const res = await fetch(`${API}/api/admin/users/${id}`, {
        method: "PUT",
        headers: authHeaders(),
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      setUsers((prev) => prev.map((u) => (u._id === id ? { ...u, ...form } : u)));
      return true;
    } catch (err) {
      console.error("Update user failed:", err);
      return false;
    }
  };

  const filteredRows = useMemo(() => {
    const q = search.toLowerCase();
    let rows = users.filter(
      (u) => u.username.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)
    );

    if (filter.role !== "all") {
      rows = rows.filter((u) => (u.role ?? "user") === filter.role);
    }

    if (filter.status !== "all") {
      rows = rows.filter((u) => (u.status ?? "active") === filter.status);
    }

    if (filter.boards !== "all") {
      rows = rows.filter((u) =>
        filter.boards === "with" ? u.boardsCount > 0 : u.boardsCount === 0
      );
    }

    if (filter.tasks !== "all") {
      rows = rows.filter((u) => {
        const total = u.taskStats?.total ?? 0;
        return filter.tasks === "with" ? total > 0 : total === 0;
      });
    }

    if (filter.joined !== "all") {
      const days = filter.joined === "7d" ? 7 : filter.joined === "30d" ? 30 : 90;
      const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
      rows = rows.filter((u) => new Date(u.createdAt).getTime() >= cutoff);
    }

    if (sortColumns.length === 0) return rows;
    return [...rows].sort((a, b) => {
      for (const { columnKey, direction } of sortColumns) {
        let cmp = 0;
        if (columnKey === "username") cmp = a.username.localeCompare(b.username);
        else if (columnKey === "email") cmp = a.email.localeCompare(b.email);
        else if (columnKey === "boardsCount") cmp = a.boardsCount - b.boardsCount;
        else if (columnKey === "taskTotal") cmp = a.taskStats.total - b.taskStats.total;
        else if (columnKey === "createdAt")
          cmp = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        if (cmp !== 0) return direction === "ASC" ? cmp : -cmp;
      }
      return 0;
    });
  }, [users, search, sortColumns, filter]);

  const summaryRows = useMemo(() => [{
    _id: "__summary__",
    username: `${filteredRows.length} users`,
    email: "",
    boardsCount: filteredRows.reduce((s, u) => s + u.boardsCount, 0),
    taskStats: {
      total: filteredRows.reduce((s, u) => s + u.taskStats.total, 0),
      todo: filteredRows.reduce((s, u) => s + u.taskStats.todo, 0),
      inProgress: filteredRows.reduce((s, u) => s + u.taskStats.inProgress, 0),
      done: filteredRows.reduce((s, u) => s + u.taskStats.done, 0),
    },
    createdAt: "",
  }], [filteredRows]);

  return {
    users,
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
    refreshRows: fetchUsers,
    deleteUser,
    bulkDeleteUsers,
    updateUser,
  };
}
