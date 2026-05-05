"use client";

import { useEffect } from "react";
import Script from "next/script";
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
        <Script 
          src="https://cdn.jsdelivr.net/npm/canvas-confetti@1.9.3/dist/confetti.browser.min.js"
          strategy="afterInteractive"
        />
        <Header />
        <main>{children}</main>
      </ThemeProvider>
    </Provider>
  );
}
