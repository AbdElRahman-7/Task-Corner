import { BoardsState, Task } from "../types/index";
import { createSlice, PayloadAction } from "@reduxjs/toolkit";

const initialState: BoardsState = {
  boards: {},
  lists: {},
  tasks: {},
  labels: {},
  selectedBoardId: undefined,
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
    addCustomList: (state, action: PayloadAction<{ boardId: string; title: string }>) => {
      const listId = crypto.randomUUID(); 
      state.lists[listId] = {
        id: listId,
        title: action.payload.title,
        taskIds: [],
        boardId: action.payload.boardId,
      };
      state.boards[action.payload.boardId].listIds.push(listId);
    },
    addTask: (state, action: PayloadAction<{ listId: string; title: string }>) => {
      const taskId = crypto.randomUUID();
      state.tasks[taskId] = {
        id: taskId,
        title: action.payload.title,
        description: "",
        priority: "medium",
        labels: [],
        checklist: [],
        progress: 0,
        status: state.lists[action.payload.listId]?.title.toLowerCase() ?? "todo",
        createdAt: Date.now(),
        autoDone: false,
      };
      state.lists[action.payload.listId].taskIds.push(taskId);
    },
    updateTask: (state, action: PayloadAction<{ taskId: string; updates: Partial<Task>; listId?: string }>) => {
      const { taskId, updates, listId } = action.payload;
      const task = state.tasks[taskId];
      if (!task) return;

      if (updates.checklist) {
        const total = updates.checklist.length;
        const done = updates.checklist.filter((item: { done: boolean }) => item.done).length;
        const progress = total === 0 ? 0 : Math.round((done / total) * 100);
        updates.progress = progress;

        const isNowComplete = progress === 100;
        const wasAutoDoneEnabled = updates.autoDone !== undefined ? updates.autoDone : task.autoDone;
        
        if (isNowComplete && wasAutoDoneEnabled && listId) {
          const currentList = state.lists[listId];
          if (currentList && currentList.title.toLowerCase() !== "done") {
            const board = state.boards[currentList.boardId];
            const doneListId = board.listIds.find(id => state.lists[id].title.toLowerCase() === "done");
            
            if (doneListId && doneListId !== listId) {
              currentList.taskIds = currentList.taskIds.filter(id => id !== taskId);
              state.lists[doneListId].taskIds.push(taskId);
              updates.status = "done";
            }
          }
        }
      }

      state.tasks[taskId] = { ...task, ...updates };
    },
    addLabel: (state, action: PayloadAction<{ id: string; title: string; color: string }>) => {
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
      }>
    ) => {
      const { taskId, fromListId, toListId, newIndex } = action.payload;
      const fromList = state.lists[fromListId];
      const toList = state.lists[toListId];
      if (!fromList || !toList) return;

      const oldIndex = fromList.taskIds.indexOf(taskId);
      if (oldIndex === -1) return;
      fromList.taskIds.splice(oldIndex, 1);

      toList.taskIds.splice(newIndex, 0, taskId);

      if (state.tasks[taskId]) {
        state.tasks[taskId].status = toList.title.toLowerCase();
      }
    },
    reorderLists: (
      state,
      action: PayloadAction<{
        boardId: string;
        oldIndex: number;
        newIndex: number;
      }>
    ) => {
      const { boardId, oldIndex, newIndex } = action.payload;
      const board = state.boards[boardId];
      if (!board) return;

      const [movedListId] = board.listIds.splice(oldIndex, 1);
      board.listIds.splice(newIndex, 0, movedListId);
    },
  },
});

export const {
  addBoard,
  addCustomList,
  addTask,
  updateTask,
  addLabel,
  deleteLabel,
  moveTask,
  reorderLists,
} = boardSlice.actions;
export default boardSlice.reducer;
