'use client';

import { useLawyerSearch } from '@/hooks/useLawyerSearch';
import { useLawyerSearchStore } from '@/stores/lawyerSearchStore';
import { LawyerCard } from './LawyerCard';

export function LawyerCardList() {
  const { data, isLoading, isError } = useLawyerSearch();
  const { page, setPage } = useLawyerSearchStore();

  if (isLoading) {
    return (
      <div role="status" aria-label="Loading results" className="space-y-3 p-1">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-28 animate-pulse rounded-2xl bg-slate-100" />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <p role="alert" className="rounded-2xl border border-dashed border-gray-200 bg-white p-8 text-center text-sm text-slate-400">
        Failed to load results. Please try again.
      </p>
    );
  }

  if (!data || data.items.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-10 text-center">
        <p className="text-sm text-slate-400">No lawyers found matching your filters.</p>
        <p className="mt-1 text-xs text-slate-300">Try adjusting your search criteria.</p>
      </div>
    );
  }

  const from = (data.page - 1) * data.limit + 1;
  const to = Math.min(data.page * data.limit, data.total);

  return (
    <div>
      <p className="mb-4 text-sm text-slate-500">
        Showing <span className="font-semibold text-slate-800">{from}–{to}</span> of {data.total}{' '}
        verified lawyer{data.total !== 1 ? 's' : ''}
      </p>

      <div className="space-y-4">
        {data.items.map((lawyer) => (
          <LawyerCard key={lawyer.id} lawyer={lawyer} />
        ))}
      </div>

      {data.totalPages > 1 && (
        <nav aria-label="Pagination" className="mt-6 flex items-center justify-between">
          <button
            disabled={page <= 1}
            onClick={() => setPage(page - 1)}
            className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-navy hover:border-gold disabled:cursor-not-allowed disabled:text-slate-300"
          >
            ← Previous
          </button>
          <span className="text-xs text-slate-400">
            Page {page} of {data.totalPages}
          </span>
          <button
            disabled={page >= data.totalPages}
            onClick={() => setPage(page + 1)}
            className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-navy hover:border-gold disabled:cursor-not-allowed disabled:text-slate-300"
          >
            Next →
          </button>
        </nav>
      )}
    </div>
  );
}
