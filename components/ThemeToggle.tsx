"use client";

// Переключатель день/ночь. Тему хранит атрибут data-theme на <html>,
// а выбор запоминается в localStorage. Начальное значение ставит скрипт в app/layout.tsx.
export default function ThemeToggle() {
  function toggle() {
    const root = document.documentElement;
    const next = root.dataset.theme === "dark" ? "light" : "dark";
    root.dataset.theme = next;
    try {
      localStorage.setItem("theme", next);
    } catch {
      // localStorage может быть недоступен (приватный режим), тема просто не запомнится
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
      <span aria-hidden="true">☀️</span>
      <span aria-hidden="true">🌙</span>
    </button>
  );
}
