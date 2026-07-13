'use client';

import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import Link from 'next/link';
import { adminCreateUser, fetchAdminLawyers, type AdminLawyer, type LawyerSort } from '@/lib/api/admin';
import AdminPageHeader from '@/components/site/AdminPageHeader';
import Icon from '@/components/ui/Icon';
import Pagination from '@/components/ui/Pagination';

const TABS: { key: string; label: string }[] = [
  { key: 'PENDING', label: 'Pending' },
  { key: 'APPROVED', label: 'Approved' },
  { key: 'REJECTED', label: 'Rejected' },
  { key: 'SUSPENDED', label: 'Suspended' },
  { key: 'AWAITING_ONBOARDING', label: 'Awaiting onboarding' },
  { key: 'ALL', label: 'All' },
];

const STATUS_BADGE: Record<string, string> = {
  PENDING: 'bg-amber-50 text-amber-700',
  UNDER_REVIEW: 'bg-amber-50 text-amber-700',
  APPROVED: 'bg-green-50 text-green-700',
  REJECTED: 'bg-rose-50 text-rose-600',
  SUSPENDED: 'bg-orange-50 text-orange-700',
  AWAITING_ONBOARDING: 'bg-sky-50 text-sky-600',
};

function statusLabel(s: string) {
  if (s === 'UNDER_REVIEW') return 'REVIEW';
  if (s === 'AWAITING_ONBOARDING') return 'SIGNED UP';
  return s;
}

function lawyerInitials(name: string) {
  return name
    .replace('Adv. ', '')
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

export default function AdminLawyersPage() {
  const [tab, setTab] = useState('PENDING');
  const [search, setSearch] = useState('');
  const [qv, setQv] = useState('');
  const [sort, setSort] = useState<LawyerSort>('newest');
  const [page, setPage] = useState(1);
  const qc = useQueryClient();
  const [form, setForm] = useState<{ fullName: string; email: string; mobile: string } | null>(null);
  const [tempPw, setTempPw] = useState<{ email: string; password: string } | null>(null);
  const [error, setError] = useState('');

  const q = useQuery({
    queryKey: ['admin-lawyers', tab, qv, sort, page],
    queryFn: () => fetchAdminLawyers(tab, qv || undefined, sort, page, 20),
    placeholderData: keepPreviousData,
  });

  const createM = useMutation({
    mutationFn: () =>
      adminCreateUser({
        fullName: form!.fullName,
        email: form!.email,
        mobile: form!.mobile,
        role: 'LAWYER',
      }),
    onSuccess: (res) => {
      setForm(null);
      if (res.tempPassword) setTempPw({ email: res.user.email, password: res.tempPassword });
      setTab('AWAITING_ONBOARDING');
      setPage(1);
      qc.invalidateQueries({ queryKey: ['admin-lawyers'] });
    },
    onError: (e: Error) => setError(e.message),
  });

  const rows = q.data?.items ?? [];
  const total = q.data?.total ?? 0;
  const awaitingTab = tab === 'AWAITING_ONBOARDING';

  return (
    <div>
      <AdminPageHeader
        title="Lawyers"
        subtitle="All lawyer accounts — review, approve, reject, or suspend. Paid lawyers appear first in the pending queue."
        right={
          tab === 'PENDING' && total > 0 ? (
            <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-bold text-amber-600">
              {total} awaiting review
            </span>
          ) : undefined
        }
      />

      <div className="p-6">
        {/* controls */}
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <button
            onClick={() => { setError(''); setForm({ fullName: '', email: '', mobile: '' }); }}
            className="rounded-xl bg-navy px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
          >
            <Icon name="plus" aria-hidden="true" className="mr-1 text-xs" /> Add lawyer
          </button>
          <div className="relative flex-1 sm:max-w-xs">
            <Icon name="magnifying-glass" aria-hidden="true" className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400" />
            <input
              type="search"
              aria-label="Search lawyers by name, enrollment, state, email, or mobile"
              value={search}
              onChange={(e) => {
                const v = e.target.value;
                setSearch(v);
                setPage(1);
                setTimeout(() => setQv((prev) => (v === prev ? prev : v)), 300);
              }}
              placeholder="Search name, enrollment, email, mobile…"
              className="w-full rounded-xl border border-gray-200 bg-white py-2 pl-9 pr-3 text-sm focus:border-gold focus:outline-none"
            />
          </div>
          <label htmlFor="lawyer-sort" className="text-xs font-bold uppercase tracking-wide text-slate-400">Sort by</label>
          <select
            id="lawyer-sort"
            value={sort}
            onChange={(e) => { setSort(e.target.value as LawyerSort); setPage(1); }}
            className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm focus:border-gold focus:outline-none"
          >
            <option value="newest">Newest</option>
            <option value="name">Name (A–Z)</option>
            <option value="mobile">Mobile</option>
            <option value="status">Status</option>
          </select>
          <div role="tablist" aria-label="Filter by verification status" className="flex flex-wrap gap-1 text-sm font-semibold">
            {TABS.map((t) => (
              <button
                key={t.key}
                role="tab"
                aria-selected={tab === t.key}
                onClick={() => { setTab(t.key); setPage(1); }}
                className={`rounded-xl px-3 py-1.5 ${tab === t.key ? 'bg-navy text-white' : 'text-slate-500 hover:bg-slate-100'}`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <p role="alert" className="mb-4 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>
        )}
        {q.isError && (
          <p role="alert" className="mb-4 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">
            Couldn&apos;t load lawyers: {(q.error as Error).message}
          </p>
        )}

        <div className="overflow-hidden rounded-2xl border border-gray-200/60 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-[11px] uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-5 py-3 text-left font-bold">Lawyer</th>
                  <th className="px-5 py-3 text-left font-bold">{awaitingTab ? 'Registered' : 'City'}</th>
                  <th className="px-5 py-3 text-left font-bold">Email</th>
                  <th className="px-5 py-3 text-left font-bold">Mobile</th>
                  <th className="px-5 py-3 text-left font-bold">Practice areas</th>
                  <th className="px-5 py-3 text-left font-bold">Plan</th>
                  <th className="px-5 py-3 text-left font-bold">Status</th>
                  <th className="px-5 py-3 text-right font-bold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {rows.map((l: AdminLawyer) => {
                  const areas = l.practiceAreas.map((p) => p.practiceArea.name);
                  return (
                    <tr key={l.id} className="hover:bg-slate-50">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <span aria-hidden="true" className="hero-gradient flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-xs font-extrabold text-gold">
                            {lawyerInitials(l.fullName)}
                          </span>
                          <span className="min-w-0">
                            <span className="block truncate font-semibold text-slate-800">{l.fullName}</span>
                            <span className="block truncate text-[11px] text-slate-400">
                              {l.barCouncilNumber || 'No enrollment submitted'}
                            </span>
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-slate-600">
                        {l.verificationStatus === 'AWAITING_ONBOARDING'
                          ? new Date(l.createdAt).toLocaleDateString()
                          : l.city?.name ?? '—'}
                      </td>
                      <td className="px-5 py-3 text-slate-600">{l.user.email}</td>
                      <td className="px-5 py-3 text-slate-500">{l.user.mobile}</td>
                      <td className="max-w-[180px] truncate px-5 py-3 text-slate-500" title={areas.join(', ')}>
                        {areas.length === 0 ? '—' : areas.length <= 2 ? areas.join(', ') : `${areas.slice(0, 2).join(', ')} +${areas.length - 2}`}
                      </td>
                      <td className="px-5 py-3">
                        {l.subscriptionStatus === 'ACTIVE' ? (
                          <span className="rounded-full bg-green-50 px-2 py-0.5 text-[10px] font-bold text-green-700">PAID</span>
                        ) : (
                          <span className="text-xs text-slate-400">{l.subscriptionStatus}</span>
                        )}
                      </td>
                      <td className="px-5 py-3">
                        <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${STATUS_BADGE[l.verificationStatus] ?? 'bg-slate-100 text-slate-500'}`}>
                          {statusLabel(l.verificationStatus)}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-5 py-3 text-right">
                        <Link
                          href={`/admin/approvals/${l.id}`}
                          className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-bold text-navy hover:border-gold hover:text-gold"
                        >
                          {l.verificationStatus === 'AWAITING_ONBOARDING' ? 'View' : 'Review'}
                          <Icon name="chevron-right" aria-hidden="true" className="ml-1 text-[10px]" />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {q.isLoading && <p role="status" className="p-6 text-center text-sm text-slate-400">Loading…</p>}
          {!q.isLoading && rows.length === 0 && (
            <p className="p-6 text-center text-sm text-slate-400">
              No lawyers here{qv ? ' matching your search' : ''}.
            </p>
          )}
          {q.data && (
            <Pagination
              page={q.data.page}
              totalPages={q.data.totalPages}
              total={q.data.total}
              pageSize={q.data.pageSize}
              onPageChange={setPage}
              label="lawyer"
            />
          )}
        </div>
      </div>

      {/* add lawyer modal */}
      {form && (
        <div role="dialog" aria-modal="true" aria-labelledby="lawyer-form-title" className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setForm(null)} />
          <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h3 id="lawyer-form-title" className="mb-1 text-lg font-bold text-navy">Add lawyer</h3>
            <p className="mb-5 text-xs text-slate-500">
              Account is created pre-verified; a one-time temporary password is shown after saving.
              The lawyer stays under &ldquo;Awaiting onboarding&rdquo; until they submit Bar details + ID card.
            </p>

            <label htmlFor="lf-name" className="mb-1.5 block text-xs font-bold uppercase text-slate-500">Full name</label>
            <input id="lf-name" value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} className="mb-3 w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:border-gold focus:outline-none" />

            <label htmlFor="lf-email" className="mb-1.5 block text-xs font-bold uppercase text-slate-500">Email</label>
            <input id="lf-email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="mb-3 w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:border-gold focus:outline-none" />

            <label htmlFor="lf-mobile" className="mb-1.5 block text-xs font-bold uppercase text-slate-500">Mobile</label>
            <input id="lf-mobile" type="tel" value={form.mobile} placeholder="+919876543210" onChange={(e) => setForm({ ...form, mobile: e.target.value })} className="mb-4 w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:border-gold focus:outline-none" />

            <div className="flex justify-end gap-2">
              <button onClick={() => setForm(null)} className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-slate-600">Cancel</button>
              <button
                onClick={() => { setError(''); createM.mutate(); }}
                disabled={createM.isPending || form.fullName.trim().length < 2 || !form.email || !form.mobile}
                className="rounded-xl bg-gold px-5 py-2 text-sm font-bold text-navy disabled:opacity-50"
              >
                {createM.isPending ? 'Saving…' : 'Create lawyer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* one-time temp password modal */}
      {tempPw && (
        <div role="dialog" aria-modal="true" aria-labelledby="temp-pw-title" className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setTempPw(null)} />
          <div className="relative w-full max-w-sm rounded-2xl bg-white p-6 text-center shadow-xl">
            <div aria-hidden="true" className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-green-50 text-2xl text-green-500">
              <Icon name="key" />
            </div>
            <h3 id="temp-pw-title" className="text-lg font-bold text-navy">Temporary password</h3>
            <p className="mt-1 text-xs text-slate-500">
              For <b>{tempPw.email}</b> — shown only once. Share it securely; they should change it
              in Settings after signing in.
            </p>
            <p className="mt-4 select-all rounded-xl border border-dashed border-gold/60 bg-amber-50/50 px-4 py-3 font-mono text-lg font-bold tracking-wide text-navy">
              {tempPw.password}
            </p>
            <button
              onClick={() => { navigator.clipboard?.writeText(tempPw.password).catch(() => {}); }}
              className="mt-3 text-xs font-semibold text-navy hover:text-gold"
            >
              Copy to clipboard
            </button>
            <div className="mt-4">
              <button onClick={() => setTempPw(null)} className="rounded-xl bg-navy px-5 py-2 text-sm font-bold text-white">
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
