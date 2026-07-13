'use client';

/**
 * Shared pagination control — hidden when there's a single page.
 * Pass `total` + `pageSize` (and optionally `label`) to also show a
 * "Showing x–y of N" summary.
 */
export default function Pagination({
  page,
  totalPages,
  onPageChange,
  total,
  pageSize,
  label = 'item',
  className = '',
}: {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  total?: number;
  pageSize?: number;
  label?: string;
  className?: string;
}) {
  if (totalPages <= 1) return null;

  const summary =
    total !== undefined && pageSize !== undefined
      ? `Showing ${(page - 1) * pageSize + 1}–${Math.min(page * pageSize, total)} of ${total} ${label}${total !== 1 ? 's' : ''}`
      : `Page ${page} of ${totalPages}`;

  return (
    <nav
      aria-label="Pagination"
      className={`mt-4 flex flex-wrap items-center justify-between gap-2 px-1 py-2 ${className}`}
    >
      <button
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
        className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-navy hover:border-gold disabled:cursor-not-allowed disabled:text-slate-300"
      >
        ← Previous
      </button>
      <span className="text-xs text-slate-400" aria-live="polite">
        {summary}
      </span>
      <button
        disabled={page >= totalPages}
        onClick={() => onPageChange(page + 1)}
        className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-navy hover:border-gold disabled:cursor-not-allowed disabled:text-slate-300"
      >
        Next →
      </button>
    </nav>
  );
}
