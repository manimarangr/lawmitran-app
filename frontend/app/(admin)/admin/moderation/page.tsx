'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { fetchReports, reviewReport, type AdminReport, type ReportStatus } from '@/lib/api/admin';
import AdminPageHeader from '@/components/site/AdminPageHeader';
import Pagination from '@/components/ui/Pagination';

const TABS: (ReportStatus | 'ALL')[] = ['OPEN', 'ACTIONED', 'DISMISSED', 'ALL'];
const stBadge: Record<string, string> = {
  OPEN: 'bg-blue-50 text-blue-700',
  ACTIONED: 'bg-rose-50 text-rose-700',
  DISMISSED: 'bg-slate-100 text-slate-500',
};

export default function ModerationPage() {
  const qc = useQueryClient();
  const [filter, setFilter] = useState<ReportStatus | 'ALL'>('OPEN');
  const [page, setPage] = useState(1);

  const q = useQuery({
    queryKey: ['admin-reports', filter, page],
    queryFn: () => fetchReports(filter === 'ALL' ? undefined : filter, page),
  });
  const reports = q.data?.items ?? [];

  const m = useMutation({
    mutationFn: ({ id, status, suspend }: { id: string; status: 'ACTIONED' | 'DISMISSED'; suspend?: boolean }) =>
      reviewReport(id, status, undefined, suspend),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-reports'] }),
  });

  return (
    <div>
      <AdminPageHeader title="Moderation" subtitle="Reports from clients & lawyers — review and act." />
      <div className="p-6">
      <div role="tablist" aria-label="Filter reports" className="mb-4 flex gap-1 border-b border-gray-200 text-sm font-semibold">
        {TABS.map((t) => (
          <button
            key={t}
            role="tab"
            aria-selected={filter === t}
            onClick={() => { setFilter(t); setPage(1); }}
            className={`border-b-2 px-3 py-2 ${filter === t ? 'border-gold text-navy' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
          >
            {t.charAt(0) + t.slice(1).toLowerCase()}
          </button>
        ))}
      </div>

      {q.isLoading && <p role="status" className="text-sm text-slate-400">Loading…</p>}
      {!q.isLoading && reports.length === 0 && (
        <div className="rounded-2xl border border-dashed border-gray-200 p-10 text-center text-sm text-slate-400">No reports here.</div>
      )}

      <div className="space-y-3">
        {reports.map((r: AdminReport) => (
          <div key={r.id} className="rounded-2xl border border-gray-200/60 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm">
                  <span className="font-bold text-slate-900">{r.reporter.email}</span>{' '}
                  <span className="text-slate-400">({r.reporter.role})</span>{' '}
                  <span className="text-slate-400">reported</span>{' '}
                  <span className="font-bold text-slate-900">{r.reportedUser.email}</span>{' '}
                  <span className="text-slate-400">({r.reportedUser.role})</span>
                </p>
                <p className="mt-1 text-xs"><span className="font-semibold text-slate-600">{r.reason}</span> · {new Date(r.createdAt).toLocaleDateString()}</p>
                {r.details && <p className="mt-2 rounded-lg border border-gray-100 bg-slate-50 px-3 py-2 text-sm text-slate-500">&quot;{r.details}&quot;</p>}
              </div>
              <span className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold ${stBadge[r.status]}`}>{r.status}</span>
            </div>
            {r.status === 'OPEN' && (
              <div className="mt-4 flex flex-wrap gap-2">
                <button onClick={() => m.mutate({ id: r.id, status: 'DISMISSED' })} className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-slate-600">Dismiss</button>
                <button onClick={() => m.mutate({ id: r.id, status: 'ACTIONED' })} className="rounded-lg bg-navy px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800">Action (note)</button>
                <button onClick={() => m.mutate({ id: r.id, status: 'ACTIONED', suspend: true })} className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-bold text-white hover:bg-rose-700">Action &amp; suspend</button>
              </div>
            )}
          </div>
        ))}
      </div>
      <Pagination page={page} totalPages={q.data?.totalPages ?? 1} onPageChange={setPage} />
      </div>
    </div>
  );
}
