"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search, X } from "lucide-react";
import Dropdown from "@/components/Dropdown";

type Option = { value: string; label: string };

/** Поиск, фильтр и сортировка для небольших списков, которые рисует сервер. */
export default function ListFilters({
  children,
  options = [],
  searchPlaceholder = "Поиск по списку",
  filterLabel = "Все",
  sortOptions = [],
}: {
  children: ReactNode;
  options?: Option[];
  searchPlaceholder?: string;
  filterLabel?: string;
  sortOptions?: Option[];
}) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("");
  const root = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const countRef = useRef<HTMLSpanElement>(null);

  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  useEffect(() => {
    const needle = query.trim().toLocaleLowerCase("ru").replace(/ё/g, "е");
    const items = root.current?.querySelectorAll<HTMLElement>("[data-filter-item]") ?? [];
    let shown = 0;
    items.forEach((item) => {
      const text = (item.dataset.search ?? item.textContent ?? "").toLocaleLowerCase("ru").replace(/ё/g, "е");
      const textOk = !needle || needle.split(/\s+/).every((w) => text.includes(w));
      const filterOk = !filter || (item.dataset.filter ?? "").split(" ").includes(filter);
      item.hidden = !textOk || !filterOk;
      if (!item.hidden) shown += 1;
    });
    if (countRef.current) {
      countRef.current.textContent = `Найдено: ${shown} из ${items.length}`;
    }
  }, [children, filter, query]);

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

  function changeSort(value: string) {
    const next = new URLSearchParams(params.toString());
    next.set("sort", value);
    router.replace(`${pathname}?${next.toString()}`, { scroll: false });
  }

  const hasActive = query.trim() !== "" || filter !== "";

  return (
    <div className="list-filters" ref={root}>
      <div className="card fbar">
        <div className="fbar-top">
          <label className="fbar-search">
            <Search size={18} />
            <input
              ref={searchRef}
              type="search"
              value={query}
              placeholder={searchPlaceholder}
              aria-label={searchPlaceholder}
              onChange={(e) => setQuery(e.target.value)}
            />
            <kbd>/</kbd>
          </label>

{options.length > 0 && (
  <Dropdown
    label="Показать"
    value={filter}
    options={[{ value: "", label: filterLabel }, ...options]}
    onChange={setFilter}
  />
)}

{sortOptions.length > 0 && (
  <Dropdown
    label="Сортировка"
    value={params.get("sort") ?? sortOptions[0].value}
    options={sortOptions}
    onChange={changeSort}
  />
)}
        </div>

        <div className="fbar-meta">
          <span ref={countRef} className="muted small" />
          {hasActive && (
            <button
              type="button"
              className="fbar-reset"
              onClick={() => {
                setQuery("");
                setFilter("");
              }}
            >
              <X size={12} /> Сбросить
            </button>
          )}
        </div>
      </div>

      <div>{children}</div>
    </div>
  );
}