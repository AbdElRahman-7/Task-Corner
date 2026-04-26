"use client";

import { useEffect } from "react";
import { Provider } from "react-redux";
import { store } from "@store";
import { Toaster } from "react-hot-toast";
import { ThemeProvider } from "@components/ThemeProvider/ThemeProvider";
import { loadState } from "@store/localStorage";
import { hydrateState } from "@store/boardSlice";
import Header from "@components/Header/Header";

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const loadedState = loadState();
    if (loadedState && loadedState.boards) {
      store.dispatch(hydrateState(loadedState.boards));
    }
  }, []);

  return (
    <Provider store={store}>
      <ThemeProvider>
        <Toaster
          position="bottom-right"
          containerStyle={{ zIndex: 99999 }}
        />
        <Header />
        <main>{children}</main>
      </ThemeProvider>
    </Provider>
  );
}
