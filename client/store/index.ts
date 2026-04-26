import { configureStore, combineReducers } from "@reduxjs/toolkit";
import boardReducer from "@store/boardSlice";
import authReducer from "@store/authSlice";
import { loadState, saveState } from "@store/localStorage";

const rootReducer = combineReducers({
  boards: boardReducer,
  auth: authReducer,
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
