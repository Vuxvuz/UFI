// src/components/DarkModeToggle.jsx
import React from "react";
import useDarkMode from "../hooks/useDarkMode";

export default function DarkModeToggle() {
  const [darkMode, setDarkMode] = useDarkMode();

  return (
    <button
      className="btn btn-outline-secondary"
      onClick={() => setDarkMode(m => !m)}
    >
      {darkMode ? "☀️ Light Mode" : "🌙 Dark Mode"}
    </button>
  );
}
