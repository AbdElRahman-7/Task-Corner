import React, { useState } from "react";
import { Users, X, ChevronDown, Trash2, Filter } from "lucide-react";
import type { UsersBulkFilter } from "./useUsers";

interface BulkActionsProps {
  selectedCount: number;
  onDeleteSelected: () => void;
  onClearSelection: () => void;
  filter: UsersBulkFilter;
  onChangeFilter: (next: UsersBulkFilter) => void;
  onResetFilter: () => void;
}

export default function BulkActions({
  selectedCount,
  onDeleteSelected,
  onClearSelection,
  filter,
  onChangeFilter,
  onResetFilter,
}: BulkActionsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const hasSelection = selectedCount > 0;

  return (
    <div className="relative group">
      <button
        type="button"
        onClick={() => setIsOpen((o) => !o)}
        className="group flex items-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-2xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-zinc-800 transition-all shadow-sm"
      >
        <Users className={`w-4 h-4 ${hasSelection ? "text-violet-500" : "text-gray-400"}`} />
        Filter 
        {selectedCount > 0 && (
          <span className="bg-violet-600 text-white text-[10px] rounded-full px-1.5 py-0.5 min-w-[18px] text-center ml-0.5 shadow-sm">
            {selectedCount}
          </span>
        )}
        <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 top-full mt-2 w-96 bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-zinc-700 shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="px-4 py-2 border-b border-gray-100 dark:border-zinc-800 bg-gray-50/50 dark:bg-zinc-800/50">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Selected Rows ({selectedCount})</p>
            </div>

            <div className="px-4 py-3 border-b border-gray-100 dark:border-zinc-800">
              <div className="flex items-center justify-between gap-3 mb-2">
                <div className="flex items-center gap-2 text-xs font-extrabold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  <Filter className="w-3.5 h-3.5" />
                  Filter users
                </div>
                <button
                  type="button"
                  onClick={onResetFilter}
                  className="text-[11px] font-bold text-violet-600 dark:text-violet-400 hover:opacity-80"
                >
                  Reset
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2 mb-2">
                <label className="flex flex-col gap-1">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Role</span>
                  <select
                    value={filter.role}
                    onChange={(e) => onChangeFilter({ ...filter, role: e.target.value as UsersBulkFilter["role"] })}
                    className="w-full px-2.5 py-2 text-xs font-semibold rounded-xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500"
                  >
                    <option value="all">All</option>
                    <option value="admin">Admin</option>
                    <option value="user">User</option>
                  </select>
                </label>

                <label className="flex flex-col gap-1">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Status</span>
                  <select
                    value={filter.status}
                    onChange={(e) => onChangeFilter({ ...filter, status: e.target.value as UsersBulkFilter["status"] })}
                    className="w-full px-2.5 py-2 text-xs font-semibold rounded-xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500"
                  >
                    <option value="all">All</option>
                    <option value="active">Active</option>
                    <option value="disabled">Disabled</option>
                  </select>
                </label>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <label className="flex flex-col gap-1">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Boards</span>
                  <select
                    value={filter.boards}
                    onChange={(e) => onChangeFilter({ ...filter, boards: e.target.value as UsersBulkFilter["boards"] })}
                    className="w-full px-2.5 py-2 text-xs font-semibold rounded-xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500"
                  >
                    <option value="all">All</option>
                    <option value="with">With</option>
                    <option value="without">Without</option>
                  </select>
                </label>

                <label className="flex flex-col gap-1">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Tasks</span>
                  <select
                    value={filter.tasks}
                    onChange={(e) => onChangeFilter({ ...filter, tasks: e.target.value as UsersBulkFilter["tasks"] })}
                    className="w-full px-2.5 py-2 text-xs font-semibold rounded-xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500"
                  >
                    <option value="all">All</option>
                    <option value="with">With</option>
                    <option value="without">Without</option>
                  </select>
                </label>

                <label className="flex flex-col gap-1">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Joined</span>
                  <select
                    value={filter.joined}
                    onChange={(e) => onChangeFilter({ ...filter, joined: e.target.value as UsersBulkFilter["joined"] })}
                    className="w-full px-2.5 py-2 text-xs font-semibold rounded-xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500"
                  >
                    <option value="all">Any</option>
                    <option value="7d">Last 7d</option>
                    <option value="30d">Last 30d</option>
                    <option value="90d">Last 90d</option>
                  </select>
                </label>
              </div>
              <p className="mt-2 text-[11px] text-gray-400">
                Filters apply before bulk actions. Hidden users are excluded.
              </p>
            </div>

            <button
              type="button"
              disabled={!hasSelection}
              onClick={() => { onDeleteSelected(); setIsOpen(false); }}
              className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all text-left disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent"
            >
              <div className="p-1.5 rounded-lg bg-red-100 dark:bg-red-900/40"><Trash2 className="w-3.5 h-3.5" /></div>
              Delete selected
            </button>
            <button
              type="button"
              disabled={!hasSelection}
              onClick={() => { onClearSelection(); setIsOpen(false); }}
              className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-zinc-800 transition-all text-left disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent"
            >
              <div className="p-1.5 rounded-lg bg-gray-100 dark:bg-zinc-800"><X className="w-3.5 h-3.5" /></div>
              Clear selection
            </button>
          </div>
        </>
      )}
    </div>
  );
}
