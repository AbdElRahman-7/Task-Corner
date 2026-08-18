import { configureStore, combineReducers } from "@reduxjs/toolkit";
import boardReducer from "@store/boardSlice";
import authReducer from "@store/authSlice";
import { saveState } from "@store/localStorage";

const rootReducer = combineReducers({
  boards: boardReducer,
  auth: authReducer,
});

export const store = configureStore({
  reducer: rootReducer,
});

store.subscribe(() => {
  saveState(store.getState());
});

export type RootState = ReturnType<typeof rootReducer>;
export type AppDispatch = typeof store.dispatch;
