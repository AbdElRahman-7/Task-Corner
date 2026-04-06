import { BoardsState } from "../types/index";
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
  
  },
});

export const {
  addBoard,
  addCustomList,
} = boardSlice.actions;
export default boardSlice.reducer;
