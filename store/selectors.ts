import { createSelector } from "@reduxjs/toolkit";
import { RootState } from "./index";
import { Task } from "../types/index";

const selectTasks = (state: RootState) => state.boards.tasks;
const selectFilters = (state: RootState) => state.boards.filters;

// Helper to filter a single task based on global filters
const matchesFilters = (task: Task, filters: any) => {
  const matchesSearch =
    !filters.search ||
    (task.title + " " + (task.description || ""))
      .toLowerCase()
      .includes(filters.search.toLowerCase());

  const matchesPriority =
    !filters.priority.length || filters.priority.includes(task.priority);

  const matchesLabels =
    !filters.labelIds.length ||
    filters.labelIds.every((id: string) => task.labels.includes(id));

  const matchesStatus =
    filters.status === "all" || 
    task.status === filters.status || 
    task.listId === filters.status;

  let matchesDue = true;
  if (filters.due !== "all" && task.dueDate) {
    const dueDate = new Date(task.dueDate);
    const today = new Date();
    const isSameDay = dueDate.toDateString() === today.toDateString();
    const isBeforeToday = dueDate < today && !isSameDay;

    if (filters.due === "today") matchesDue = isSameDay;
    else if (filters.due === "overdue") matchesDue = isBeforeToday;
  } else if (filters.due !== "all" && !task.dueDate) {
    matchesDue = false;
  }

  return matchesSearch && matchesPriority && matchesLabels && matchesStatus && matchesDue;
};

// NEW: Stable, ordered selector for tasks within a specific list
export const selectOrderedTasksByList = (listId: string) => createSelector(
  [
    (state: RootState) => state.boards.lists[listId]?.taskIds || [],
    (state: RootState) => state.boards.tasks,
    selectFilters
  ],
  (taskIds, allTasks, filters) => {
    // 1. Maintain order by mapping over taskIds
    // 2. Filter out tasks that don't match criteria
    return taskIds.filter(taskId => {
      const task = allTasks[taskId];
      if (!task) return false;
      return matchesFilters(task, filters);
    });
  }
);


