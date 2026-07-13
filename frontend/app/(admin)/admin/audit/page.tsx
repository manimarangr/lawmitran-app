'use client';

import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { Fragment, useState } from 'react';
import { fetchAuditLogs, type AuditEntry } from '@/lib/api/admin';
import AdminPageHeader from '@/components/site/AdminPageHeader';
import Icon from '@/components/ui/Icon';
import Pagination from '@/components/ui/Pagination';

function actionChip(action: string) {
  if (action.includes('APPROVED') || action.includes('PAID') || action.includes('ACTIVE')) return 'bg-green-50 text-green-700';
  if (action.includes('REJECTED') || action.includes('DELETED') || action.includes('FAILED')) return 'bg-rose-50 text-rose-600';
  if (action.includes('SUSPENDED')) return 'bg-orange-50 text-orange-700';
  if (action.includes('SETTINGS')) return 'bg-sky-50 text-sky-600';
  return 'bg-slate-100 text-slate-600';
}

function DiffBlock({ label, value }: { label: string; value: Record<string, unknown> | null }) {
  if (!value || Object.keys(value).length === 0) return null;
  return (
    <div className="min-w-0">
      <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">{label}</p>
      <pre className="overflow-x-auto whitespace-pre-wrap break-all rounded-lg bg-slate-50 px-2.5 py-1.5 font-mono text-[11px] text-slate-600">
        {Object.entries(value).map(([k, v]) => `${k}: ${String(v)}`).join('\n')}
      </pre>
    </div>
  );
}

export default function AdminAuditPage() {
  const [search, setSearch] = useState('');
  const [qv, setQv] = useState('');
  const [page, setPage] = useState(1);
  const [openId, setOpenId] = useState<string | null>(null);

  const q = useQuery({
    queryKey: ['admin-audit', qv, page],
    queryFn: () => fetchAuditLogs(qv || undefined, page),
    placeholderData: keepPreviousData,
  });
  const rows = q.data?.items ?? [];

  return (
    <div>
      <AdminPageHeader
        title="Audit Log"
        subtitle="Append-only trail of every admin action — who, what, when, from where"
      />
      <div className="p-6">
        <div className="relative mb-4 sm:max-w-sm">
          <Icon name="magnifying-glass" aria-hidden="true" className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400" />
          <input
            type="search"
            aria-label="Search audit log by action, summary, or admin email"
            value={search}
            onChange={(e) => {
              const v = e.target.value;
              setSearch(v);
              setPage(1);
              setTimeout(() => setQv((prev) => (v === prev ? prev : v)), 300);
            }}
            placeholder="Search action, summary, admin email…"
            className="w-full rounded-xl border border-gray-200 bg-white py-2 pl-9 pr-3 text-sm focus:border-gold focus:outline-none"
          />
        </div>

        {q.isError && (
          <p role="alert" className="mb-4 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">
            Couldn&apos;t load the audit log: {(q.error as Error).message}
          </p>
        )}

        <div className="overflow-hidden rounded-2xl border border-gray-200/60 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-[11px] uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-5 py-3 text-left font-bold">When</th>
                  <th className="px-5 py-3 text-left font-bold">Admin</th>
                  <th className="px-5 py-3 text-left font-bold">Action</th>
                  <th className="px-5 py-3 text-left font-bold">Summary</th>
                  <th className="px-5 py-3 text-left font-bold">IP</th>
                  <th className="px-5 py-3 text-right font-bold" aria-label="Details" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {rows.map((e: AuditEntry) => {
                  const open = openId === e.id;
                  const hasDiff = !!(e.oldValue && Object.keys(e.oldValue).length) || !!(e.newValue && Object.keys(e.newValue).length);
                  return (
                    <Fragment key={e.id}>
                      <tr className="hover:bg-slate-50">
                        <td className="whitespace-nowrap px-5 py-3 text-slate-500">
                          {new Date(e.createdAt).toLocaleDateString()}
                          <span className="block text-[11px] text-slate-400">{new Date(e.createdAt).toLocaleTimeString()}</span>
                        </td>
                        <td className="px-5 py-3 text-slate-600">{e.actor?.email ?? '—'}</td>
                        <td className="px-5 py-3">
                          <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${actionChip(e.action)}`}>
                            {e.action.replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td className="max-w-[340px] px-5 py-3 text-slate-600">
                          <span className="line-clamp-2">{e.summary || '—'}</span>
                        </td>
                        <td className="whitespace-nowrap px-5 py-3 font-mono text-[11px] text-slate-400">{e.ip ?? '—'}</td>
                        <td className="px-5 py-3 text-right">
                          {hasDiff && (
                            <button
                              onClick={() => setOpenId(open ? null : e.id)}
                              aria-expanded={open}
                              className="text-xs font-semibold text-navy hover:text-gold"
                            >
                              {open ? 'Hide' : 'Diff'}
                              <Icon name="chevron-down" aria-hidden="true" className={`ml-1 text-[9px] transition ${open ? 'rotate-180' : ''}`} />
                            </button>
                          )}
                        </td>
                      </tr>
                      {open && (
                        <tr className="bg-slate-50/60">
                          <td colSpan={6} className="px-5 py-3">
                            <div className="grid gap-3 sm:grid-cols-2">
                              <DiffBlock label="Before" value={e.oldValue} />
                              <DiffBlock label="After" value={e.newValue} />
                            </div>
                            {e.userAgent && <p className="mt-2 truncate text-[10px] text-slate-400">UA: {e.userAgent}</p>}
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
          {q.isLoading && <p role="status" className="p-6 text-center text-sm text-slate-400">Loading…</p>}
          {!q.isLoading && rows.length === 0 && (
            <p className="p-6 text-center text-sm text-slate-400">No audit entries{qv ? ' matching your search' : ''} yet.</p>
          )}
          {q.data && (
            <Pagination
              page={q.data.page}
              totalPages={q.data.totalPages}
              total={q.data.total}
              pageSize={q.data.pageSize}
              onPageChange={setPage}
              label="entry"
            />
          )}
        </div>
      </div>
    </div>
  );
}
