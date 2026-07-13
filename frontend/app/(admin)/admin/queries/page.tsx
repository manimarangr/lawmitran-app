'use client';

import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import {
  categoryLabel,
  fetchContactQueries,
  updateContactQuery,
  type AdminContactQuery,
} from '@/lib/api/contact';
import AdminPageHeader from '@/components/site/AdminPageHeader';
import Pagination from '@/components/ui/Pagination';
import Icon from '@/components/ui/Icon';

const TABS: ('OPEN' | 'RESOLVED' | 'ALL')[] = ['OPEN', 'RESOLVED', 'ALL'];

const CATEGORY_STYLE: Record<string, string> = {
  PAYMENT_ISSUE: 'bg-rose-50 text-rose-700',
  ID_CARD_UPLOAD_ISSUE: 'bg-amber-50 text-amber-700',
  SUBSCRIPTION_ISSUE: 'bg-purple-50 text-purple-700',
  ACCOUNT_ISSUE: 'bg-blue-50 text-blue-700',
  LEAD_ISSUE: 'bg-teal-50 text-teal-700',
  VERIFICATION_ISSUE: 'bg-orange-50 text-orange-700',
  TECHNICAL_ISSUE: 'bg-slate-100 text-slate-600',
  OTHER: 'bg-slate-100 text-slate-600',
};

export default function AdminQueriesPage() {
  const qc = useQueryClient();
  const [tab, setTab] = useState<'OPEN' | 'RESOLVED' | 'ALL'>('OPEN');
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [qv, setQv] = useState(''); // debounced value used in the query
  const [noteFor, setNoteFor] = useState<AdminContactQuery | null>(null);
  const [note, setNote] = useState('');
  const [error, setError] = useState('');

  const q = useQuery({
    queryKey: ['admin-queries', tab, qv, page],
    queryFn: () => fetchContactQueries(tab === 'ALL' ? undefined : tab, qv || undefined, page),
    placeholderData: keepPreviousData,
  });
  const rows = q.data?.items ?? [];

  const invalidate = () => qc.invalidateQueries({ queryKey: ['admin-queries'] });

  const m = useMutation({
    mutationFn: ({ id, status, adminNote }: { id: string; status?: 'OPEN' | 'RESOLVED'; adminNote?: string }) =>
      updateContactQuery(id, { status, adminNote }),
    onSuccess: () => { setNoteFor(null); setNote(''); invalidate(); },
    onError: (e: Error) => setError(e.message),
  });

  const openCount = tab === 'OPEN' ? (q.data?.total ?? 0) : 0;

  return (
    <div>
      <AdminPageHeader
        title="Client Queries"
        subtitle="Contact-us submissions — payment issues, ID card upload trouble, and more."
        right={
          tab !== 'RESOLVED' && openCount > 0 ? (
            <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-bold text-amber-600">
              {openCount} open
            </span>
          ) : undefined
        }
      />
      <div className="p-6">
        <div className="relative mb-4 sm:max-w-xs">
          <Icon name="magnifying-glass" aria-hidden="true" className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400" />
          <input
            type="search"
            aria-label="Search queries by name, email, subject, or message"
            value={search}
            onChange={(e) => {
              const v = e.target.value;
              setSearch(v);
              setTimeout(() => setQv((prev) => {
                if (v === prev) return prev;
                setPage(1);
                return v;
              }), 300);
            }}
            placeholder="Search name, email, subject…"
            className="w-full rounded-xl border border-gray-200 bg-white py-2 pl-9 pr-3 text-sm focus:border-gold focus:outline-none"
          />
        </div>
        <div role="tablist" aria-label="Filter queries" className="mb-4 flex gap-1 border-b border-gray-200 text-sm font-semibold">
          {TABS.map((t) => (
            <button
              key={t}
              role="tab"
              aria-selected={tab === t}
              onClick={() => { setTab(t); setPage(1); }}
              className={`border-b-2 px-3 py-2 ${tab === t ? 'border-gold text-navy' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
            >
              {t.charAt(0) + t.slice(1).toLowerCase()}
            </button>
          ))}
        </div>

        {error && (
          <p role="alert" className="mb-4 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>
        )}
        {q.isLoading && <p role="status" className="text-sm text-slate-400">Loading…</p>}
        {!q.isLoading && rows.length === 0 && (
          <div className="rounded-2xl border border-dashed border-gray-200 p-10 text-center text-sm text-slate-400">
            {qv ? 'No queries match your search.' : `No ${tab === 'ALL' ? '' : tab.toLowerCase()} queries.`}
          </div>
        )}

        <div className="space-y-3">
          {rows.map((c) => (
            <article key={c.id} className="rounded-2xl border border-gray-200/60 bg-white p-5 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm">
                    <span className="font-bold text-slate-900">{c.name}</span>{' '}
                    <a href={`mailto:${c.email}`} className="text-slate-500 hover:text-gold">&lt;{c.email}&gt;</a>
                    {c.mobile && <span className="text-slate-400"> · +91 {c.mobile}</span>}
                  </p>
                  <p className="mt-1.5">
                    <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${CATEGORY_STYLE[c.category] ?? 'bg-slate-100 text-slate-600'}`}>
                      {categoryLabel(c.category)}
                    </span>
                    <span className="ml-2 text-[11px] text-slate-400">
                      {new Date(c.createdAt).toLocaleString()}
                    </span>
                  </p>
                  {c.subject && <p className="mt-2 text-sm font-semibold text-slate-800">{c.subject}</p>}
                  <p className="mt-1 whitespace-pre-wrap text-sm text-slate-600">{c.message}</p>
                  {c.adminNote && (
                    <p className="mt-2 rounded-lg border border-gray-100 bg-slate-50 px-3 py-2 text-xs text-slate-500">
                      <Icon name="note-sticky" aria-hidden="true" className="mr-1 text-gold" />
                      {c.adminNote}
                    </p>
                  )}
                </div>
                <span className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold ${c.status === 'OPEN' ? 'bg-blue-50 text-blue-700' : 'bg-green-50 text-green-700'}`}>
                  {c.status}
                </span>
              </div>

              <div className="mt-3 flex flex-wrap gap-3 border-t border-gray-100 pt-3 text-xs font-semibold">
                <a
                  href={`mailto:${c.email}?subject=${encodeURIComponent(`Re: ${c.subject ?? categoryLabel(c.category)} — LawMitran support`)}`}
                  className="text-navy hover:text-gold"
                >
                  <Icon name="envelope" aria-hidden="true" className="mr-1" /> Reply by email
                </a>
                <button onClick={() => { setNoteFor(c); setNote(c.adminNote ?? ''); }} className="text-slate-500 hover:text-navy">
                  <Icon name="note-sticky" aria-hidden="true" className="mr-1" /> Add note
                </button>
                {c.status === 'OPEN' ? (
                  <button
                    onClick={() => { setError(''); m.mutate({ id: c.id, status: 'RESOLVED' }); }}
                    className="text-green-600 hover:underline"
                  >
                    <Icon name="circle-check" aria-hidden="true" className="mr-1" /> Mark resolved
                  </button>
                ) : (
                  <button
                    onClick={() => { setError(''); m.mutate({ id: c.id, status: 'OPEN' }); }}
                    className="text-amber-600 hover:underline"
                  >
                    Reopen
                  </button>
                )}
              </div>
            </article>
          ))}
        </div>

        {q.data && (
          <div className="mt-4 overflow-hidden rounded-2xl border border-gray-200/60 bg-white">
            <Pagination
              page={q.data.page}
              totalPages={q.data.totalPages}
              total={q.data.total}
              pageSize={q.data.pageSize}
              onPageChange={setPage}
              label="query"
            />
          </div>
        )}
      </div>

      {noteFor && (
        <div role="dialog" aria-modal="true" aria-labelledby="query-note-title" className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setNoteFor(null)} />
          <div className="relative w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            <h3 id="query-note-title" className="mb-1 text-lg font-bold text-navy">Internal note</h3>
            <p className="mb-4 text-xs text-slate-500">Visible to admins only — e.g. what was done to resolve it.</p>
            <label htmlFor="query-note" className="sr-only">Note</label>
            <textarea
              id="query-note"
              rows={4}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="mb-4 w-full resize-none rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:border-gold focus:outline-none"
            />
            <div className="flex justify-end gap-2">
              <button onClick={() => setNoteFor(null)} className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-slate-600">Cancel</button>
              <button
                onClick={() => { setError(''); m.mutate({ id: noteFor.id, adminNote: note }); }}
                disabled={m.isPending}
                className="rounded-xl bg-gold px-5 py-2 text-sm font-bold text-navy disabled:opacity-50"
              >
                {m.isPending ? 'Saving…' : 'Save note'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
