import { usePathname } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import CustomSelect from "./CustomSelect";
import { RootState } from "@store/index";
import {
  setSearch,
  setPriorityFilter,
  setLabelFilter,
  setStatusFilter,
  setDueFilter,
  clearFilters,
} from "@store/boardSlice";
import { toast } from "react-hot-toast";
import { useMemo } from "react";
import type { AppDispatch } from "@store/index";

const Filters = ({ compact = false }: { compact?: boolean }) => {
  const dispatch = useDispatch<AppDispatch>();
  const pathname = usePathname();
  const isHomePage = pathname === "/";

  const { search, priority, labelIds, status, due } = useSelector(
    (state: RootState) => state.boards.filters
  );
  const allLabels = useSelector((state: RootState) => state.boards.labels);
  const lists = useSelector((state: RootState) => state.boards.lists);

  const statusOptions = useMemo(() => {
  return Array.from(
    new Set(Object.values(lists).map(l => l.title.toLowerCase()))
  );
}, [lists]);

  const priorityOptions = [
    { value: "all", label: "All Priorities" },
    { value: "low", label: "Low Priority", color: "#10b981" },
    { value: "medium", label: "Medium Priority", color: "#f59e0b" },
    { value: "high", label: "High Priority", color: "#ef4444" },
  ];

  const labelOptions = [
    { value: "all", label: "All Labels" },
    ...Object.values(allLabels).map(label => ({
      value: label.id,
      label: label.title,
      color: label.color
    }))
  ];

  const handlePriorityChange = (val: string) => {
    dispatch(setPriorityFilter(val === "all" ? [] : [val]));
  };

  const handleLabelChange = (val: string) => {
    dispatch(setLabelFilter(val === "all" ? [] : [val]));
  };

  if (compact) {
    if (isHomePage) {
      return (
        <div className="filtersCompact">
          <div className="filtersCompact__search">
            <input
              type="text"
              placeholder="Search workspaces..."
              value={search}
              onChange={(e) => dispatch(setSearch(e.target.value))}
              className="filterCompactInput filterCompactInput--home"
            />
            {search && (
              <button 
                onClick={() => dispatch(setSearch(""))}
                className="filtersCompact__clear"
              >
                ✕
              </button>
            )}
          </div>
          <button
            onClick={() => {
              dispatch(clearFilters());
              toast.success("Searches cleared!");
            }}
            className="filterCompactReset"
          >
            Clear
          </button>
        </div>
      );
    }

    return (
      <div className="filtersCompact">
        <input
          type="text"
          placeholder="Filter..."
          value={search}
          onChange={(e) => dispatch(setSearch(e.target.value))}
          className="filterCompactInput"
        />

        <div className="filtersCompact__selects">
          <CustomSelect
            options={priorityOptions}
            value={priority[0] || "all"}
            onChange={handlePriorityChange}
            className="filterCompactSelect"
          />

          <CustomSelect
            options={labelOptions}
            value={labelIds[0] || "all"}
            onChange={handleLabelChange}
            className="filterCompactSelect"
          />
        </div>

        <button
          onClick={() => {
            dispatch(clearFilters());
            toast.success("Filters cleared!");
          }}
          className="filterCompactReset"
        >
          Reset
        </button>
      </div>
    );
  }

  return (
    <div className="filters">
      <div className="filterGroup filterGroup--grow">
        <label className="filterLabel">Search Items</label>
        <input
          type="text"
          placeholder={isHomePage ? "Filter boards by title..." : "Filter tasks by title, description..."}
          value={search}
          onChange={(e) => dispatch(setSearch(e.target.value))}
          className="filterInput"
        />
      </div>

      <div className="filters__grid">
        <div className="filterGroup">
          <label className="filterLabel">Priority</label>
          <CustomSelect
            options={priorityOptions}
            value={priority[0] || "all"}
            onChange={handlePriorityChange}
          />
        </div>

        <div className="filterGroup">
          <label className="filterLabel">Labels</label>
          <CustomSelect
            options={labelOptions}
            value={labelIds[0] || "all"}
            onChange={handleLabelChange}
          />
        </div>

        <div className="filterGroup">
          <label className="filterLabel">Status</label>
          <select
            value={status}
            onChange={(e) => dispatch(setStatusFilter(e.target.value))}
            className="filterSelect"
          >
            <option value="all">All Columns</option>
            {statusOptions.map(opt => (
              <option key={opt} value={opt}>{opt.toUpperCase()}</option>
            ))}
          </select>
        </div>

        <div className="filterGroup">
          <label className="filterLabel">Timeline</label>
          <select
            value={due}
            onChange={(e) =>
              dispatch(setDueFilter(e.target.value as RootState["boards"]["filters"]["due"]))
            }
            className="filterSelect"
          >
            <option value="all">Anytime</option>
            <option value="today">Due Today</option>
            <option value="overdue">Overdue</option>
          </select>
        </div>
      </div>

      <div className="filters__actions">
        <button
          onClick={() => {
            dispatch(clearFilters());
            toast.success("Filters cleared!");
          }}
          className="filterResetBtn"
        >
          Reset All
        </button>
      </div>
    </div>
  );
};

export default Filters;