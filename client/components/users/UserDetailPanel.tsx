import React, { useEffect, useState, useCallback } from "react";
import { X, LayoutDashboard, Pencil, Trash2 } from "lucide-react";
import { BoardRole, UserRow } from "@appTypes/index";
import Avatar from "./Avatar";
import RoleToggle from "./RoleToggle";
import { API, authHeaders } from "./userConfig";

interface UserDetailPanelProps {
  user: UserRow;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export default function UserDetailPanel({
  user,
  onClose,
  onEdit,
  onDelete,
}: UserDetailPanelProps) {
  const [boards, setBoards] = useState<BoardRole[]>([]);
  const [loadingBoards, setLoadingBoards] = useState(true);
  const [boardsError, setBoardsError] = useState("");
  const [togglingId, setTogglingId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoadingBoards(true);
    setBoardsError("");
    setBoards([]);

    fetch(`${API}/api/admin/users/${user._id}/boards`, { headers: authHeaders() })
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        if (data.success) setBoards(data.boardRoles ?? []);
        else setBoardsError(data.message ?? "Failed to load boards");
      })
      .catch(() => {
        if (!cancelled) setBoardsError("Could not reach server");
      })
      .finally(() => {
        if (!cancelled) setLoadingBoards(false);
      });

    return () => { cancelled = true; };
  }, [user._id]);

  const handleRoleChange = useCallback(
    async (boardId: string, newRole: "viewer" | "editor") => {
      setTogglingId(boardId);
      setBoards((prev) =>
        prev.map((b) => (b.boardId === boardId ? { ...b, role: newRole } : b))
      );
      try {
        await fetch(`${API}/api/admin/users/${user._id}/boards/${boardId}/role`, {
          method: "PUT",
          headers: authHeaders(),
          body: JSON.stringify({ role: newRole }),
        });
      } catch {
        // revert on error
        setBoards((prev) =>
          prev.map((b) =>
            b.boardId === boardId
              ? { ...b, role: newRole === "viewer" ? "editor" : "viewer" }
              : b
          )
        );
      } finally {
        setTogglingId(null);
      }
    },
    [user._id]
  );

  return (
    <>
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[1050]"
        onClick={onClose}
        aria-hidden="true"
      />

      <aside className="fixed right-0 top-0 h-full w-full max-w-sm bg-white dark:bg-zinc-900 shadow-2xl z-[1100] flex flex-col border-l border-gray-200 dark:border-zinc-700">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-zinc-800 shrink-0 sticky top-0 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md z-10">
          <div className="flex items-center gap-3 overflow-hidden">
            <Avatar name={user.username} size="sm" />
            <div className="leading-tight truncate">
              <h2 className="font-bold text-gray-900 dark:text-white text-base truncate">{user.username}</h2>
              <p className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">User Profile</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="group relative z-20 p-2 -mr-2 rounded-xl text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all shrink-0 shadow-sm sm:shadow-none"
            aria-label="Close panel"
          >
            <X className="w-5 h-5 group-hover:rotate-90 transition-all duration-300" />
          </button>
        </div>

        <div className="px-5 py-5 border-b border-gray-100 dark:border-zinc-800 shrink-0">
          <div className="flex items-center gap-4">
            <Avatar name={user.username} size="lg" />
            <div className="min-w-0">
              <p className="font-semibold text-gray-900 dark:text-white text-base truncate">{user.username}</p>
              <p className="text-sm text-gray-400 truncate">{user.email}</p>
              <p className="text-xs text-gray-400 mt-0.5">
                Joined{" "}
                {new Date(user.createdAt).toLocaleDateString("en-GB", {
                  day: "2-digit", month: "short", year: "numeric",
                })}
              </p>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-2 text-center">
            <div className="rounded-xl bg-sky-50 dark:bg-sky-900/20 py-2.5">
              <p className="text-lg font-bold text-sky-600 dark:text-sky-400">{user.boardsCount}</p>
              <p className="text-xs text-sky-500 dark:text-sky-400">Boards</p>
            </div>
            <div className="rounded-xl bg-amber-50 dark:bg-amber-900/20 py-2.5">
              <p className="text-lg font-bold text-amber-600 dark:text-amber-400">{user.taskStats.inProgress}</p>
              <p className="text-xs text-amber-500 dark:text-amber-400">Active</p>
            </div>
            <div className="rounded-xl bg-emerald-50 dark:bg-emerald-900/20 py-2.5">
              <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{user.taskStats.done}</p>
              <p className="text-xs text-emerald-500 dark:text-emerald-400">Done</p>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-3">
            Boards & Roles
          </p>

          {loadingBoards ? (
            <div className="flex items-center justify-center gap-2 py-12 text-sm text-gray-400">
              <span className="w-4 h-4 border-2 border-gray-200 border-t-violet-500 rounded-full animate-spin" />
              Loading boards…
            </div>
          ) : boardsError ? (
            <div className="flex flex-col items-center gap-2 py-10 text-center">
              <LayoutDashboard className="w-7 h-7 text-red-300 opacity-60" />
              <p className="text-sm text-red-400">{boardsError}</p>
            </div>
          ) : boards.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-12 text-sm text-gray-400">
              <LayoutDashboard className="w-7 h-7 opacity-30" />
              <p>No boards found for this user.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {boards.map((b) => (
                <div
                  key={b.boardId}
                  className="flex items-center justify-between gap-3 p-3 rounded-xl border border-gray-100 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-800/50"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="p-1.5 rounded-lg bg-white dark:bg-zinc-700 border border-gray-200 dark:border-zinc-600 shrink-0">
                      <LayoutDashboard className="w-3.5 h-3.5 text-sky-500" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">
                        {b.boardName}
                      </p>
                      <p className={`text-xs font-medium ${
                        b.role === "editor"
                          ? "text-violet-600 dark:text-violet-400"
                          : "text-sky-600 dark:text-sky-400"
                      }`}>
                        {b.role === "editor" ? "✏️ Editor" : "👁 Viewer"}
                      </p>
                    </div>
                  </div>

                  <RoleToggle
                    role={b.role}
                    disabled={togglingId === b.boardId}
                    onChange={(r) => handleRoleChange(b.boardId, r)}
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="shrink-0 px-5 py-4 border-t border-gray-100 dark:border-zinc-800 flex gap-2">
          <button
            type="button"
            onClick={onEdit}
            className="flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-xl border border-gray-200 dark:border-zinc-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors"
          >
            <Pencil className="w-3.5 h-3.5" />
            Edit User
          </button>
          <button
            type="button"
            onClick={onDelete}
            className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium rounded-xl border border-red-200 dark:border-red-900/40 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </aside>
    </>
  );
}
