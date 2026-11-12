
"use client";

import { Sun, Moon } from "lucide-react";

// Переключатель день/ночь
export default function ThemeToggle() {
  function toggle() {
    const root = document.documentElement;
    const next = root.dataset.theme === "dark" ? "light" : "dark";

    root.dataset.theme = next;

    try {
      localStorage.setItem("theme", next);
    } catch {
      // localStorage может быть недоступен
    }
  }

  return (
    <button
      type="button"
      className="theme-toggle"
      onClick={toggle}
      aria-label="Переключить тему: день или ночь"
      title="День / ночь"
    >
      <Sun size={19} aria-hidden="true" />
      <Moon size={19} aria-hidden="true" />
    </button>
  );
}
