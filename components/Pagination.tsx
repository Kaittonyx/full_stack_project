import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { hrefWith, PER_PAGE_OPTIONS } from "@/lib/list-query";

function pageList(page: number, pages: number): (number | "…")[] {
  const set = new Set([1, pages, page - 1, page, page + 1].filter((p) => p >= 1 && p <= pages));
  const sorted = [...set].sort((a, b) => a - b);
  const out: (number | "…")[] = [];
  sorted.forEach((p, i) => {
    if (i > 0 && p - sorted[i - 1] > 1) out.push("…");
    out.push(p);
  });
  return out;
}

export default function Pagination({
  path,
  query,
  page,
  pages,
  per,
  from,
  to,
  total,
}: {
  path: string;
  query: Record<string, string>;
  page: number;
  pages: number;
  per: number;
  from: number;
  to: number;
  total: number;
}) {
  if (total <= PER_PAGE_OPTIONS[0]) return null;
  const go = (p: number) => hrefWith(path, query, { page: p > 1 ? String(p) : null });

  return (
    <nav className="pager" aria-label="Страницы">
      <span className="muted small">
        Показаны {from}–{to} из {total.toLocaleString("ru-RU")}
      </span>

      {pages > 1 && (
        <div className="pager-pages">
          {page > 1 ? (
            <Link href={go(page - 1)} className="pager-btn" aria-label="Предыдущая">
              <ChevronLeft size={16} />
            </Link>
          ) : (
            <span className="pager-btn off">
              <ChevronLeft size={16} />
            </span>
          )}
          {pageList(page, pages).map((p, i) =>
            p === "…" ? (
              <span key={`gap-${i}`} className="pager-gap">
                …
              </span>
            ) : (
              <Link
                key={p}
                href={go(p)}
                className={p === page ? "pager-btn on" : "pager-btn"}
                aria-current={p === page ? "page" : undefined}
              >
                {p}
              </Link>
            ),
          )}
          {page < pages ? (
            <Link href={go(page + 1)} className="pager-btn" aria-label="Следующая">
              <ChevronRight size={16} />
            </Link>
          ) : (
            <span className="pager-btn off">
              <ChevronRight size={16} />
            </span>
          )}
        </div>
      )}

      <span className="pager-per small">
        По:
        {PER_PAGE_OPTIONS.map((n) => (
          <Link
            key={n}
            href={hrefWith(path, query, { per: n === 25 ? null : String(n), page: null })}
            className={n === per ? "on" : undefined}
          >
            {n}
          </Link>
        ))}
      </span>
    </nav>
  );
}