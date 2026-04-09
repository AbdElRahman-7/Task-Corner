import { configureStore, combineReducers } from "@reduxjs/toolkit";
import boardReducer from "./boardSlice";
import { loadState, saveState } from "./localStorage";

const rootReducer = combineReducers({
  boards: boardReducer,
});

const preloadedState = loadState();

export const store = configureStore({
  reducer: rootReducer,
  preloadedState,
});

store.subscribe(() => {
  saveState(store.getState());
});

export type RootState = ReturnType<typeof rootReducer>;
export type AppDispatch = typeof store.dispatch;
