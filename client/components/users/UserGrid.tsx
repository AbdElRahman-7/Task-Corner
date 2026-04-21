import React, { useMemo } from "react";
import { DataGrid, type Column, type SortColumn } from "react-data-grid";
import "react-data-grid/lib/styles.css";
import { LayoutDashboard, Clock, CheckSquare, Pencil, Trash2 } from "lucide-react";
import { UserRow } from "@appTypes/index";
import Avatar from "./Avatar";

interface UserGridProps {
  rows: UserRow[];
  summaryRows: any[];
  sortColumns: readonly SortColumn[];
  onSortColumnsChange: (cols: readonly SortColumn[]) => void;
  selectedRows: ReadonlySet<string>;
  onSelectedRowsChange: (rows: ReadonlySet<string>) => void;
  onViewDetail: (user: UserRow) => void;
  onEdit: (user: UserRow) => void;
  onDelete: (id: string) => void;
}

export default function UserGrid({
  rows,
  summaryRows,
  sortColumns,
  onSortColumnsChange,
  selectedRows,
  onSelectedRowsChange,
  onViewDetail,
  onEdit,
  onDelete,
}: UserGridProps) {
  const columns: Column<UserRow, any>[] = useMemo(
    () => [
      {
        key: "username",
        name: "User",
        sortable: true,
        minWidth: 220,
        renderCell({ row }) {
          return (
            <button
              type="button"
              className="flex items-center gap-2.5 h-full w-full text-left group"
              onClick={() => onViewDetail(row)}
            >
              <Avatar name={row.username} />
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-white leading-tight group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors truncate">
                  {row.username}
                </p>
                <p className="text-xs text-gray-400 truncate">{row.email}</p>
              </div>
            </button>
          );
        },
        renderSummaryCell({ row }) {
          return (
            <span className="text-xs font-semibold text-violet-600 dark:text-violet-400">
              {row.username}
            </span>
          );
        },
      },
      {
        key: "boardsCount",
        name: "Boards",
        sortable: true,
        width: 100,
        renderCell({ row }) {
          return (
            <div className="flex items-center gap-1.5 h-full text-gray-700 dark:text-gray-300">
              <LayoutDashboard className="w-3.5 h-3.5 text-sky-500" />
              <span className="font-medium text-sm">{row.boardsCount}</span>
            </div>
          );
        },
        renderSummaryCell({ row }) {
          return (
            <div className="flex items-center gap-1 h-full">
              <LayoutDashboard className="w-3.5 h-3.5 text-sky-500" />
              <span className="text-xs font-semibold text-sky-600 dark:text-sky-400">
                {row.boardsCount}
              </span>
            </div>
          );
        },
      },
      {
        key: "taskTotal",
        name: "Tasks",
        sortable: true,
        width: 290,
        renderCell({ row }) {
          const { todo, inProgress, done } = row.taskStats;
          return (
            <div className="flex items-center gap-1.5 h-full flex-wrap">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600 dark:bg-zinc-700 dark:text-zinc-300">
                Todo <strong>{todo}</strong>
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400">
                <Clock className="w-3 h-3" /> {inProgress}
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400">
                <CheckSquare className="w-3 h-3" /> {done}
              </span>
            </div>
          );
        },
        renderSummaryCell({ row }) {
          return (
            <div className="flex items-center gap-1.5 h-full text-xs font-semibold">
              <span className="text-gray-500 dark:text-gray-400">{row.taskStats.todo} todo</span>
              <span className="text-amber-600 dark:text-amber-400">· {row.taskStats.inProgress} active</span>
              <span className="text-emerald-600 dark:text-emerald-400">· {row.taskStats.done} done</span>
            </div>
          );
        },
      },
      {
        key: "createdAt",
        name: "Joined",
        sortable: true,
        width: 120,
        renderCell({ row }) {
          return (
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {new Date(row.createdAt).toLocaleDateString("en-GB", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              })}
            </span>
          );
        },
        renderSummaryCell() {
          return null;
        },
      },
      {
        key: "actions",
        name: "",
        width: 90,
        renderCell({ row }) {
          return (
            <div className="flex items-center justify-end gap-1 h-full pr-1">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(row);
                }}
                className="p-1.5 rounded-lg text-gray-400 hover:text-violet-600 hover:bg-violet-50 dark:hover:bg-violet-900/20 transition-colors"
                title="Edit"
              >
                <Pencil className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(row._id);
                }}
                className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                title="Delete"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        },
        renderSummaryCell() {
          return null;
        },
      },
    ],
    [onViewDetail, onEdit, onDelete]
  );

  return (
    <div className="rounded-2xl overflow-hidden border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 shadow-sm transition-all duration-300">
      <DataGrid
        columns={columns}
        rows={rows}
        rowKeyGetter={(row) => row._id}
        selectedRows={selectedRows}
        onSelectedRowsChange={onSelectedRowsChange}
        sortColumns={sortColumns}
        onSortColumnsChange={onSortColumnsChange}
        bottomSummaryRows={summaryRows}
        rowHeight={56}
        headerRowHeight={44}
        summaryRowHeight={40}
        style={{
          ["--rdg-selection-color" as string]: "#7c3aed",
          ["--rdg-checkbox-color" as string]: "#7c3aed",
          blockSize: "auto",
        }}
      />
    </div>
  );
}
