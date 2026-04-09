"use client";

import { useTheme } from "./ThemeProvider";

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <button
      onClick={toggleTheme}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      className="themeToggle"
    >
      <div className={`themeToggle__knob ${isDark ? "themeToggle__knob--dark" : ""}`}>
        {isDark ? "🌙" : "☀️"}
      </div>
    </button>
  );
}