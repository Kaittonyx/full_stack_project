"use client";

import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";
import { Check, ChevronDown } from "lucide-react";

export type DropdownOption = { value: string; label: string };

export default function Dropdown({
  value,
  options,
  onChange,
  label,
}: {
  value: string;
  options: DropdownOption[];
  onChange: (value: string) => void;
  label?: string;
}) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const root = useRef<HTMLDivElement>(null);
  const listId = useId();

  const current = options.find((o) => o.value === value) ?? options[0];

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  function openList() {
    setActive(Math.max(0, options.findIndex((o) => o.value === value)));
    setOpen(true);
  }

  function choose(v: string) {
    onChange(v);
    setOpen(false);
  }

  function onKey(e: KeyboardEvent) {
    if (!open) {
      if (["ArrowDown", "ArrowUp", "Enter", " "].includes(e.key)) {
        e.preventDefault();
        openList();
      }
      return;
    }
    if (e.key === "Escape") {
      e.preventDefault();
      setOpen(false);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => Math.min(a + 1, options.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      choose(options[active].value);
    } else if (e.key === "Tab") {
      setOpen(false);
    }
  }

  return (
    <div className={open ? "dd open" : "dd"} ref={root}>
      <button
        type="button"
        className="dd-trigger"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-label={label ? `${label}: ${current?.label ?? ""}` : undefined}
        onClick={() => (open ? setOpen(false) : openList())}
        onKeyDown={onKey}
      >
        {label && <span className="dd-label">{label}</span>}
        <span className="dd-value">{current?.label}</span>
        <ChevronDown size={16} className="dd-chevron" />
      </button>

      {open && (
        <ul id={listId} role="listbox" className="dd-menu" aria-label={label}>
          {options.map((o, i) => {
            const selected = o.value === value;
            return (
              <li
                key={o.value}
                role="option"
                aria-selected={selected}
                className={`dd-item${i === active ? " active" : ""}${selected ? " selected" : ""}`}
                onMouseEnter={() => setActive(i)}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => choose(o.value)}
              >
                <span>{o.label}</span>
                {selected && <Check size={16} />}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}