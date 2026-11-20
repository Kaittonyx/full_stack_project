"use client";

import { useEffect, useState, type ReactNode } from "react";
import { X } from "lucide-react";

// Кнопка, которая открывает окно поверх страницы. Содержимое передаётся как children.
// Закрывается по крестику, по клику на фон и по Escape.
export default function Dialog({
  buttonLabel,
  title,
  children,
}: {
  buttonLabel: string;
  title: string;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      <button type="button" className="btn btn-ghost btn-sm" onClick={() => setOpen(true)}>
        {buttonLabel}
      </button>

      {open && (
        <div className="dialog-overlay" onClick={() => setOpen(false)}>
          <div
            className="dialog"
            role="dialog"
            aria-modal="true"
            aria-label={title}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="dialog-head">
              <h2>{title}</h2>
              <button
                type="button"
                className="dialog-close"
                onClick={() => setOpen(false)}
                aria-label="Закрыть"
              >
                <X size={20} />
              </button>
            </div>
            <div className="dialog-body">{children}</div>
          </div>
        </div>
      )}
    </>
  );
}