"use client";

import "./globals.scss";
import { Provider } from "react-redux";
import { store } from "../store";
import { Toaster } from "react-hot-toast";
import Header from "@components/Header/Header";
import { ThemeProvider } from "@components/ThemeProvider/ThemeProvider";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <title>TaskCorner | Smart Kanban Board</title>
      </head>

      <body className="bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-100 transition-colors duration-300">
        <Provider store={store}>
          <ThemeProvider>
            <Toaster
              position="bottom-right"
              reverseOrder={false}
              containerStyle={{ zIndex: 99999 }}
            />
            <Header />
            <main>
              {children}
            </main>
          </ThemeProvider>
        </Provider>
      </body>
    </html>
  );
}
