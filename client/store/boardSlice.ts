import { createSlice, PayloadAction, createAsyncThunk } from "@reduxjs/toolkit";
import { BoardsState, Task } from "../types/index";
import { apiFetch } from "../utils/api";

export const fetchBoards = createAsyncThunk("boards/fetchAll", async (_, thunkAPI) => {
  const state = thunkAPI.getState() as any;
  const token = state.auth.token;
  return await apiFetch("/boards", { token });
});

export const loadBoardData = createAsyncThunk("boards/loadData", async (id: string, thunkAPI) => {
  const state = thunkAPI.getState() as any;
  const token = state.auth.token;
  return await apiFetch(`/boards/${id}`, { token });
});

export const addBoardDB = createAsyncThunk("boards/add", async (title: string, thunkAPI) => {
  const state = thunkAPI.getState() as any;
  const token = state.auth.token;
  return await apiFetch("/boards", {
    method: "POST",
    body: JSON.stringify({ title }),
    token
  });
});

export const addTaskDB = createAsyncThunk("tasks/add", async ({ listId, title, order }: { listId: string; title: string; order: number }, thunkAPI) => {
  const state = thunkAPI.getState() as any;
  const token = state.auth.token;
  return await apiFetch("/tasks", {
    method: "POST",
    body: JSON.stringify({ listId, title, order }),
    token
  });
});

export const updateTaskDB = createAsyncThunk("tasks/update", async ({ id, updates }: { id: string; updates: any }, thunkAPI) => {
  const state = thunkAPI.getState() as any;
  const token = state.auth.token;
  return await apiFetch(`/tasks/${id}`, {
    method: "PUT",
    body: JSON.stringify(updates),
    token
  });
});

export const deleteTaskDB = createAsyncThunk("tasks/delete", async (id: string, thunkAPI) => {
  const state = thunkAPI.getState() as any;
  const token = state.auth.token;
  return await apiFetch(`/tasks/${id}`, {
    method: "DELETE",
    token
  });
});

const initialState: BoardsState = {
  boards: {},
  lists: {},
  tasks: {},
  labels: {},
  selectedBoardId: undefined,
  filters: {
    search: "",
    priority: [],
    labelIds: [],
    status: "all",
    due: "all",
  },
};

const boardSlice = createSlice({
  name: "boards",
  initialState,
  reducers: {
    addBoard: (state, action: PayloadAction<{ id: string; title: string }>) => {
      const boardId = action.payload.id;
      state.boards[boardId] = {
        id: boardId,
        title: action.payload.title,
        listIds: [],
      };
      if (!state.selectedBoardId) state.selectedBoardId = boardId;
      const defaultLists = ["Todo", "In Progress", "Done"];
      defaultLists.forEach((listTitle) => {
        const listId = crypto.randomUUID();
        state.lists[listId] = {
          id: listId,
          title: listTitle,
          taskIds: [],
          boardId,
        };
        if (boardId && state.boards[boardId]) {
          state.boards[boardId].listIds.push(listId);
        }
      });
    },
    addCustomList: (
      state,
      action: PayloadAction<{ boardId: string; title: string }>,
    ) => {
      const listId = crypto.randomUUID();
      state.lists[listId] = {
        id: listId,
        title: action.payload.title,
        taskIds: [],
        boardId: action.payload.boardId,
      };
      state.boards[action.payload.boardId].listIds.push(listId);
    },
    addTask: (state,action: PayloadAction<{ listId: string; title: string }>,) => {
      const taskId = crypto.randomUUID();
      state.tasks[taskId] = {
        id: taskId,
        title: action.payload.title,
        description: "",
        priority: "medium",
        labels: [],
        checklist: [],
        progress: 0,
        status:
          state.lists[action.payload.listId]?.title.toLowerCase() ?? "todo",
        listId: action.payload.listId,
        createdAt: Date.now(),
        autoDone: false,
      };
      state.lists[action.payload.listId].taskIds.push(taskId);
    },
    updateTask: (
      state,
      action: PayloadAction<{
        taskId: string;
        updates: Partial<Task>;
        listId?: string;
      }>,
    ) => {
      const { taskId, updates, listId } = action.payload;
      const task = state.tasks[taskId];
      if (!task) return;

      if (updates.checklist) {
        const total = updates.checklist.length;
        const done = updates.checklist.filter(
          (item: { done: boolean }) => item.done,
        ).length;
        const progress = total === 0 ? 0 : Math.round((done / total) * 100);
        updates.progress = progress;

        // Revert to Todo if new work added to a completed task
        if (total > task.checklist.length && (task.status === "done" || task.progress === 100) && listId) {
          const currentList = state.lists[listId];
          if (currentList && currentList.title.toLowerCase() === "done") {
            const board = state.boards[currentList.boardId];
            const todoListId = board.listIds.find(
              (id) => state.lists[id].title.toLowerCase() === "todo"
            );
            if (todoListId && todoListId !== listId) {
              currentList.taskIds = currentList.taskIds.filter((id) => id !== taskId);
              state.lists[todoListId].taskIds.push(taskId);
              updates.status = "todo";
              updates.listId = todoListId;
            }
          }
        }
      }

      const currentProgress = updates.progress !== undefined ? updates.progress : task.progress;
      const currentAutoDone = updates.autoDone !== undefined ? updates.autoDone : task.autoDone;
      const isComplete = currentProgress === 100 && (updates.checklist ? updates.checklist.length > 0 : task.checklist.length > 0);

      if (isComplete && currentAutoDone && listId) {
        const currentList = state.lists[listId];
        if (currentList && currentList.title.toLowerCase() !== "done") {
          const board = state.boards[currentList.boardId];
          const doneListId = board.listIds.find(
            (id) => state.lists[id].title.toLowerCase() === "done",
          );

          if (doneListId && doneListId !== listId) {
            currentList.taskIds = currentList.taskIds.filter(
              (id) => id !== taskId,
            );
            state.lists[doneListId].taskIds.push(taskId);
            updates.status = "done";
            updates.listId = doneListId;
          }
        }
      }

      state.tasks[taskId] = { ...task, ...updates };
    },
    addLabel: (
      state,
      action: PayloadAction<{ id: string; title: string; color: string }>,
    ) => {
      const { id, title, color } = action.payload;
      state.labels[id] = { id, title, color };
    },
    deleteLabel: (state, action: PayloadAction<string>) => {
      const labelId = action.payload;
      delete state.labels[labelId];
      Object.values(state.tasks).forEach((task) => {
        task.labels = task.labels.filter((id) => id !== labelId);
      });
    },
    moveTask: (
      state,
      action: PayloadAction<{
        taskId: string;
        fromListId: string;
        toListId: string;
        newIndex: number;
      }>,
    ) => {
      const { taskId, fromListId, toListId, newIndex } = action.payload;
      const fromList = state.lists[fromListId];
      const toList = state.lists[toListId];
      if (!fromList || !toList) return;

      if (fromListId === toListId) {
        // Reordering within the same list
        const oldIndex = fromList.taskIds.indexOf(taskId);
        // Normalize newIndex (-1 means end of list)
        const targetIndex = newIndex === -1 ? fromList.taskIds.length - 1 : newIndex;
        
        if (oldIndex !== -1 && oldIndex !== targetIndex) {
          const newIds = [...fromList.taskIds];
          const [removed] = newIds.splice(oldIndex, 1);
          newIds.splice(targetIndex, 0, removed);
          fromList.taskIds = newIds;
        }
      }
 else {
        // Moving between lists
        fromList.taskIds = fromList.taskIds.filter((id) => id !== taskId);
        
        // Use slice/splice to insert at newIndex
        const newIds = [...toList.taskIds];
        const targetIndex = newIndex === -1 ? newIds.length : newIndex;
        newIds.splice(targetIndex, 0, taskId);
        toList.taskIds = newIds;

        if (state.tasks[taskId]) {
          state.tasks[taskId].listId = toListId;
          state.tasks[taskId].status = toList.title.toLowerCase();
        }
      }
    },
    reorderLists: (
      state,
      action: PayloadAction<{
        boardId: string;
        oldIndex: number;
        newIndex: number;
      }>,
    ) => {
      const { boardId, oldIndex, newIndex } = action.payload;
      const board = state.boards[boardId];
      if (!board) return;

      const result = [...board.listIds];
      const [removed] = result.splice(oldIndex, 1);
      result.splice(newIndex, 0, removed);
      board.listIds = result;
    },
    deleteTask: (state, action: PayloadAction<{ listId: string; taskId: string }>) => {
      const { listId, taskId } = action.payload;
      const list = state.lists[listId];
      if (list) {
        list.taskIds = list.taskIds.filter(id => id !== taskId);
      }
      delete state.tasks[taskId];
    },
    setSearch: (state, action) => {
      state.filters.search = action.payload;
    },

    setPriorityFilter: (state, action) => {
      state.filters.priority = action.payload;
    },

    setLabelFilter: (state, action) => {
      state.filters.labelIds = action.payload;
    },

    setStatusFilter: (state, action) => {
      state.filters.status = action.payload;
    },

    setDueFilter: (state, action) => {
      state.filters.due = action.payload;
    },

    clearFilters: (state) => {
      state.filters = {
        search: "",
        priority: [],
        labelIds: [],
        status: "all",
        due: "all",
      };
    },
    hydrateState: (state, action: PayloadAction<any>) => {
      return { ...state, ...action.payload };
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchBoards.fulfilled, (state, action) => {
        action.payload.forEach((board: any) => {
          state.boards[board._id] = {
            id: board._id,
            title: board.title,
            listIds: [],
          };
        });
      })
      .addCase(loadBoardData.fulfilled, (state, action) => {
        const { board, lists, tasks } = action.payload;
        state.boards[board._id] = {
          id: board._id,
          title: board.title,
          listIds: lists.map((l: any) => l._id),
        };
        lists.forEach((list: any) => {
          state.lists[list._id] = {
            id: list._id,
            title: list.title,
            boardId: board._id,
            taskIds: tasks.filter((t: any) => t.listId === list._id).map((t: any) => t._id),
          };
        });
        tasks.forEach((task: any) => {
          state.tasks[task._id] = {
            ...task,
            id: task._id,
          };
        });
        state.selectedBoardId = board._id;
      })
      .addCase(addBoardDB.fulfilled, (state, action) => {
        const { board, lists } = action.payload;
        state.boards[board._id] = {
          id: board._id,
          title: board.title,
          listIds: lists.map((l: any) => l._id),
        };
        lists.forEach((list: any) => {
          state.lists[list._id] = {
            id: list._id,
            title: list.title,
            boardId: board._id,
            taskIds: [],
          };
        });
      })
      .addCase(addTaskDB.fulfilled, (state, action) => {
        const task = action.payload;
        state.tasks[task._id] = { ...task, id: task._id };
        if (state.lists[task.listId]) {
          state.lists[task.listId].taskIds.push(task._id);
        }
      })
      .addCase(updateTaskDB.fulfilled, (state, action) => {
        const task = action.payload;
        state.tasks[task._id] = { ...task, id: task._id };
      })
      .addCase(deleteTaskDB.fulfilled, (state, action) => {
        const { taskId } = action.payload;
        Object.values(state.lists).forEach(list => {
          list.taskIds = list.taskIds.filter(id => id !== taskId);
        });
        delete state.tasks[taskId];
      });
  },
});

export const {
  addBoard,
  addCustomList,
  addTask,
  updateTask,
  addLabel,
  deleteLabel,
  deleteTask,
  moveTask,
  reorderLists,
  setSearch,
  setPriorityFilter,
  setLabelFilter,
  setStatusFilter,
  setDueFilter,
  clearFilters,
  hydrateState,
} = boardSlice.actions;
export default boardSlice.reducer;
