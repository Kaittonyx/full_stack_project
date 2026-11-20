"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

type Option = { value: string; label: string };

/** Client side controls for lists whose rows are rendered by a server component. */
export default function ListFilters({
  children,
  options = [],
  searchPlaceholder = "Поиск по списку",
}: {
  children: ReactNode;
  options?: Option[];
  searchPlaceholder?: string;
}) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("");
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const needle = query.trim().toLocaleLowerCase("ru");
    root.current?.querySelectorAll<HTMLElement>("[data-filter-item]").forEach((item) => {
      const textMatches = !needle || (item.dataset.search ?? item.textContent ?? "").toLocaleLowerCase("ru").includes(needle);
      const filterMatches = !filter || (item.dataset.filter ?? "").split(" ").includes(filter);
      item.hidden = !textMatches || !filterMatches;
    });
  }, [children, filter, query]);

  return (
    <div className="list-filters" ref={root}>
      <div className="list-filter-controls">
        <input
          className="input"
          type="search"
          placeholder={searchPlaceholder}
          aria-label={searchPlaceholder}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
        {options.length > 0 && (
          <select className="select" aria-label="Фильтр списка" value={filter} onChange={(event) => setFilter(event.target.value)}>
            <option value="">Все</option>
            {options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
        )}
      </div>
      <div>{children}</div>
      <style jsx>{`
        .list-filters :global([hidden]) {
          display: none !important;
        }

        .list-filter-controls {
          display: flex;
          gap: 10px;
          margin: 0 0 14px;
          width: 100%;
        }

        .list-filter-controls input {
          flex: 1 1 180px;
          min-width: 0;
          width: 100%;
          box-sizing: border-box;
        }

        .list-filter-controls select {
          flex: 0 1 170px;
          min-width: 0;
          width: 100%;
          box-sizing: border-box;
        }

        @media (max-width: 400px) {
          .list-filter-controls {
            flex-direction: column;
          }

          .list-filter-controls input,
          .list-filter-controls select {
            flex: none;
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
}
