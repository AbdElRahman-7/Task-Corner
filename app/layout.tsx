"use client";
import "./globals.css";
import { useEffect, useState } from "react";
import { Provider } from "react-redux";
import { store } from "../store";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
    const [darkMode, setDarkMode] = useState(() => {
      if (typeof window !== "undefined") {
        return localStorage.getItem("darkMode") === "true";
      }
      return false;
    });

    const toggleDarkMode = () => {
      setDarkMode((prev) => {
        localStorage.setItem("darkMode", (!prev).toString());
        return !prev;
      });
    };
  return (
    <html lang="en" className={darkMode ? "dark" : "light"}>
      <body className="bg-amber-950 text-yellow-200 p-10">
        <Provider store={store}>
          <button
            onClick={toggleDarkMode}
            className="fixed top-4 right-4 px-3 py-2 bg-yellow-100 dark:bg-green-100 rounded shadow text-black"
          >
            {darkMode ? "Light Mode" : "Dark Mode"}
          </button>
          {children}
        </Provider>
      </body>
    </html>
  );
}
