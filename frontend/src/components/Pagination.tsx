import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

/**
 * Client-side paging for a list that is already loaded. `resetKey` sends the
 * list back to page 1 when it changes (a search box, a filter); the page is
 * also clamped so deleting the last row of the last page doesn't strand you.
 */
export function usePagination<T>(items: T[] | null | undefined, pageSize = 10, resetKey?: unknown) {
  const [requested, setPage] = useState(1);

  useEffect(() => {
    setPage(1);
  }, [resetKey]);

  const total = items?.length ?? 0;
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const page = Math.min(requested, pageCount);
  const pageItems = items ? items.slice((page - 1) * pageSize, page * pageSize) : items;

  return { page, setPage, pageCount, pageItems, total, pageSize };
}

// 1 … 4 5 [6] 7 8 … 20 — always the first, last and a window around the current page.
function pageNumbers(page: number, pageCount: number): (number | "gap")[] {
  const wanted = new Set([1, pageCount, page - 1, page, page + 1]);
  const sorted = [...wanted].filter((n) => n >= 1 && n <= pageCount).sort((a, b) => a - b);
  const out: (number | "gap")[] = [];
  sorted.forEach((n, i) => {
    if (i > 0 && n - sorted[i - 1] > 1) out.push("gap");
    out.push(n);
  });
  return out;
}

interface PaginationProps {
  page: number;
  pageCount: number;
  total: number;
  pageSize: number;
  onChange: (page: number) => void;
  /** No border/padding — for lists that aren't inside a table card. */
  flush?: boolean;
}

export default function Pagination({ page, pageCount, total, pageSize, onChange, flush }: PaginationProps) {
  if (total <= pageSize) return null;

  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);
  const btn =
    "flex h-8 min-w-8 items-center justify-center rounded-md px-2 text-xs font-medium transition-colors";

  return (
    <div
      className={`flex flex-wrap items-center justify-between gap-3 ${
        flush ? "py-1" : "border-t border-grill-brown/10 px-5 py-3"
      }`}
    >
      <p className="text-xs text-grill-brown/50">
        Showing {from}–{to} of {total}
      </p>
      <nav className="flex items-center gap-1" aria-label="Pagination">
        <button
          onClick={() => onChange(page - 1)}
          disabled={page === 1}
          aria-label="Previous page"
          className={`${btn} text-grill-brown/60 hover:bg-grill-brown/5 disabled:opacity-30 disabled:hover:bg-transparent`}
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        {pageNumbers(page, pageCount).map((n, i) =>
          n === "gap" ? (
            <span key={`gap-${i}`} className="px-1 text-xs text-grill-brown/30">
              …
            </span>
          ) : (
            <button
              key={n}
              onClick={() => onChange(n)}
              aria-current={n === page ? "page" : undefined}
              className={`${btn} ${
                n === page ? "bg-grill-brown text-white" : "text-grill-brown/60 hover:bg-grill-brown/5"
              }`}
            >
              {n}
            </button>
          )
        )}
        <button
          onClick={() => onChange(page + 1)}
          disabled={page === pageCount}
          aria-label="Next page"
          className={`${btn} text-grill-brown/60 hover:bg-grill-brown/5 disabled:opacity-30 disabled:hover:bg-transparent`}
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </nav>
    </div>
  );
}
