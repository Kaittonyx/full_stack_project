"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search, SlidersHorizontal, X } from "lucide-react";
import Dropdown from "@/components/Dropdown";

export type Opt = { value: string; label: string; count?: number };

export type FilterField =
  | { type: "select"; name: string; label: string; options: Opt[] }
  | { type: "multi"; name: string; label: string; options: Opt[] }
  | { type: "daterange"; from: string; to: string; label: string }
  | { type: "range"; min: string; max: string; label: string; unit?: string };

const fmtDate = (k: string) => k.split("-").reverse().join(".");

function namesOf(f: FilterField): string[] {
  if (f.type === "daterange") return [f.from, f.to];
  if (f.type === "range") return [f.min, f.max];
  return [f.name];
}

export default function FilterBar({
  fields,
  sortOptions = [],
  searchPlaceholder = "Поиск",
  found,
  total,
}: {
  fields: FilterField[];
  sortOptions?: Opt[];
  searchPlaceholder?: string;
  found: number;
  total: number;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [pending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [text, setText] = useState(params.get("q") ?? "");
  const searchRef = useRef<HTMLInputElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  function apply(changes: Record<string, string | null>) {
    const next = new URLSearchParams(params.toString());
    for (const [k, v] of Object.entries(changes)) {
      if (v) next.set(k, v);
      else next.delete(k);
    }
    if (!("page" in changes)) next.delete("page");
    const qs = next.toString();
    startTransition(() => router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false }));
  }

  function onSearch(value: string) {
    setText(value);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => apply({ q: value.trim() || null }), 350);
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      if (e.key === "/" && tag !== "INPUT" && tag !== "TEXTAREA" && tag !== "SELECT") {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const q = params.get("q") ?? "";
  const active: { key: string; label: string; clear: Record<string, string | null> }[] = [];
  if (q) active.push({ key: "q", label: `Поиск: «${q}»`, clear: { q: null } });

  for (const f of fields) {
    if (f.type === "select") {
      const v = params.get(f.name);
      if (v) {
        const label = f.options.find((o) => o.value === v)?.label ?? v;
        active.push({ key: f.name, label: `${f.label}: ${label}`, clear: { [f.name]: null } });
      }
    }
    if (f.type === "multi") {
      const vals = (params.get(f.name) ?? "").split(",").filter(Boolean);
      for (const v of vals) {
        active.push({
          key: `${f.name}-${v}`,
          label: f.options.find((o) => o.value === v)?.label ?? v,
          clear: { [f.name]: vals.filter((x) => x !== v).join(",") || null },
        });
      }
    }
    if (f.type === "daterange") {
      const a = params.get(f.from);
      const b = params.get(f.to);
      if (a || b) {
        const text = [a ? `с ${fmtDate(a)}` : "", b ? `по ${fmtDate(b)}` : ""].filter(Boolean).join(" ");
        active.push({ key: f.from, label: `${f.label}: ${text}`, clear: { [f.from]: null, [f.to]: null } });
      }
    }
    if (f.type === "range") {
      const a = params.get(f.min);
      const b = params.get(f.max);
      if (a || b) {
        const u = f.unit ? ` ${f.unit}` : "";
        const text = [a ? `от ${a}${u}` : "", b ? `до ${b}${u}` : ""].filter(Boolean).join(" ");
        active.push({ key: f.min, label: `${f.label}: ${text}`, clear: { [f.min]: null, [f.max]: null } });
      }
    }
  }

  function resetAll() {
    clearTimeout(timer.current);
    setText("");
    const changes: Record<string, string | null> = { q: null };
    for (const f of fields) for (const n of namesOf(f)) changes[n] = null;
    apply(changes);
  }

  function toggle(name: string, value: string) {
    const vals = (params.get(name) ?? "").split(",").filter(Boolean);
    const next = vals.includes(value) ? vals.filter((v) => v !== value) : [...vals, value];
    apply({ [name]: next.join(",") || null });
  }

  const quick = fields.filter((f) => f.type === "multi");
  const advanced = fields.filter((f) => f.type !== "multi");
  const advancedCount = active.filter((a) => a.key !== "q" && !quick.some((f) => a.key.startsWith(`${f.name}-`))).length;

  return (
    <div className="card fbar">
      <div className="fbar-top">
        <label className="fbar-search">
          <Search size={18} />
          <input
            ref={searchRef}
            type="search"
            value={text}
            placeholder={searchPlaceholder}
            aria-label={searchPlaceholder}
            onChange={(e) => onSearch(e.target.value)}
          />
          <kbd>/</kbd>
        </label>

        {advanced.length > 0 && (
          <button
            type="button"
            className={open ? "btn btn-ghost btn-sm fbar-toggle on" : "btn btn-ghost btn-sm fbar-toggle"}
            onClick={() => setOpen(!open)}
            aria-expanded={open}
          >
            <SlidersHorizontal size={16} />
            Фильтры
            {advancedCount > 0 && <span className="fbar-badge">{advancedCount}</span>}
          </button>
        )}

{sortOptions.length > 0 && (
  <Dropdown
    label="Сортировка"
    value={params.get("sort") ?? sortOptions[0].value}
    options={sortOptions}
    onChange={(v) => apply({ sort: v })}
  />
)}
      </div>

      {quick.map((f) => {
        if (f.type !== "multi") return null;
        const vals = (params.get(f.name) ?? "").split(",").filter(Boolean);
        return (
          <div key={f.name} className="fbar-quick" role="group" aria-label={f.label}>
            {f.options.map((o) => (
              <button
                key={o.value}
                type="button"
                className={vals.includes(o.value) ? "chip-toggle on" : "chip-toggle"}
                aria-pressed={vals.includes(o.value)}
                onClick={() => toggle(f.name, o.value)}
                disabled={!vals.includes(o.value) && o.count === 0}
              >
                {o.label}
                {o.count !== undefined && <span className="chip-count">{o.count}</span>}
              </button>
            ))}
          </div>
        );
      })}

      {open && (
        <div className="fbar-panel">
          {advanced.map((f) => {
            if (f.type === "select") {
  return (
    <div key={f.name} className="fbar-field">
      {f.label}
      <Dropdown
        value={params.get(f.name) ?? ""}
        options={[{ value: "", label: "Все" }, ...f.options.map((o) => ({ value: o.value, label: o.label }))]}
        onChange={(v) => apply({ [f.name]: v || null })}
      />
    </div>
  );
}
            if (f.type === "daterange") {
              return (
                <div key={f.from} className="fbar-field">
                  {f.label}
                  <div className="fbar-pair">
                    <input
                      type="date"
                      className="input"
                      aria-label={`${f.label}: с`}
                      value={params.get(f.from) ?? ""}
                      onChange={(e) => apply({ [f.from]: e.target.value || null })}
                    />
                    <span className="muted">—</span>
                    <input
                      type="date"
                      className="input"
                      aria-label={`${f.label}: по`}
                      value={params.get(f.to) ?? ""}
                      onChange={(e) => apply({ [f.to]: e.target.value || null })}
                    />
                  </div>
                </div>
              );
            }
            if (f.type === "range") {
              const a = params.get(f.min) ?? "";
              const b = params.get(f.max) ?? "";
              return (
                <div key={f.min} className="fbar-field">
                  {f.label}
                  {f.unit ? `, ${f.unit}` : ""}
                  <div className="fbar-pair">
                    <input
                      key={`a-${a}`}
                      type="number"
                      min={0}
                      className="input"
                      placeholder="от"
                      aria-label={`${f.label}: от`}
                      defaultValue={a}
                      onBlur={(e) => e.target.value !== a && apply({ [f.min]: e.target.value || null })}
                      onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
                    />
                    <span className="muted">—</span>
                    <input
                      key={`b-${b}`}
                      type="number"
                      min={0}
                      className="input"
                      placeholder="до"
                      aria-label={`${f.label}: до`}
                      defaultValue={b}
                      onBlur={(e) => e.target.value !== b && apply({ [f.max]: e.target.value || null })}
                      onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
                    />
                  </div>
                </div>
              );
            }
            return null;
          })}
        </div>
      )}

      <div className="fbar-meta">
        <span className="muted small">
          Найдено: <strong>{found.toLocaleString("ru-RU")}</strong> из {total.toLocaleString("ru-RU")}
          {pending && <span className="fbar-pending"> · обновляем…</span>}
        </span>
        {active.length > 0 && (
          <div className="fbar-active">
            {active.map((a) => (
              <button key={a.key} type="button" className="active-chip" onClick={() => {
                if (a.key === "q") {
                  clearTimeout(timer.current);
                  setText("");
                }
                apply(a.clear);
              }}>
                {a.label}
                <X size={14} />
              </button>
            ))}
            <button type="button" className="fbar-reset" onClick={resetAll}>
              Сбросить всё
            </button>
          </div>
        )}
      </div>
    </div>
  );
}