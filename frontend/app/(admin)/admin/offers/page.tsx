'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import {
  createOffer,
  deleteOffer,
  fetchOffers,
  updateOffer,
  type AdminOffer,
  type OfferDiscountType,
} from '@/lib/api/admin';
import AdminPageHeader from '@/components/site/AdminPageHeader';
import Icon from '@/components/ui/Icon';

const inr = (n: number | string) => '₹' + Number(n).toLocaleString('en-IN');

function offerStatus(o: AdminOffer): { label: string; cls: string } {
  const now = new Date();
  if (!o.active) return { label: 'Disabled', cls: 'bg-slate-100 text-slate-500' };
  if (new Date(o.startsAt) > now) return { label: 'Scheduled', cls: 'bg-blue-50 text-blue-700' };
  if (new Date(o.endsAt) < now) return { label: 'Expired', cls: 'bg-slate-100 text-slate-500' };
  return { label: 'Live', cls: 'bg-green-50 text-green-700' };
}

/** datetime-local value (local time, minutes precision) from an ISO string */
const toLocal = (iso: string) => {
  const d = new Date(iso);
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
};

interface OfferForm {
  id: string | null;
  name: string;
  description: string;
  discountType: OfferDiscountType;
  discountValue: string;
  planName: string;
  durationDays: string;
  startsAt: string;
  endsAt: string;
  active: boolean;
}

const EMPTY: OfferForm = {
  id: null, name: '', description: '', discountType: 'PERCENT', discountValue: '',
  planName: '', durationDays: '', startsAt: '', endsAt: '', active: true,
};

export default function AdminOffersPage() {
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ['admin-offers'], queryFn: fetchOffers });
  const [form, setForm] = useState<OfferForm | null>(null);
  const [error, setError] = useState('');

  const invalidate = () => qc.invalidateQueries({ queryKey: ['admin-offers'] });

  const saveM = useMutation({
    mutationFn: () => {
      const f = form!;
      const payload = {
        name: f.name,
        description: f.description || undefined,
        discountType: f.discountType,
        discountValue: Number(f.discountValue),
        planName: f.planName || undefined,
        durationDays: f.durationDays ? Number(f.durationDays) : undefined,
        startsAt: new Date(f.startsAt).toISOString(),
        endsAt: new Date(f.endsAt).toISOString(),
        active: f.active,
      };
      return f.id ? updateOffer(f.id, payload) : createOffer(payload);
    },
    onSuccess: () => { setForm(null); invalidate(); },
    onError: (e: Error) => setError(e.message),
  });

  const toggleM = useMutation({
    mutationFn: (o: AdminOffer) => updateOffer(o.id, { active: !o.active }),
    onSuccess: invalidate,
    onError: (e: Error) => setError(e.message),
  });

  const deleteM = useMutation({
    mutationFn: (id: string) => deleteOffer(id),
    onSuccess: invalidate,
    onError: (e: Error) => setError(e.message),
  });

  const live = (q.data ?? []).filter((o) => offerStatus(o).label === 'Live').length;

  return (
    <div>
      <AdminPageHeader
        title="Offers"
        subtitle="Seasonal discounts (Diwali, Pongal, Christmas…) — auto-applied at checkout during their window."
        right={
          live > 0 ? (
            <span className="rounded-full border border-green-200 bg-green-50 px-3 py-1.5 text-xs font-bold text-green-700">
              {live} live now
            </span>
          ) : undefined
        }
      />
      <div className="p-6">
        <div className="mb-4 flex justify-end">
          <button
            onClick={() => setForm(EMPTY)}
            className="rounded-xl bg-navy px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
          >
            <Icon name="plus" aria-hidden="true" className="mr-1 text-xs" /> New offer
          </button>
        </div>

        {error && (
          <p role="alert" className="mb-4 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>
        )}
        {q.isLoading && <p role="status" className="text-sm text-slate-400">Loading…</p>}
        {q.data?.length === 0 && (
          <div className="rounded-2xl border border-dashed border-gray-200 p-10 text-center text-sm text-slate-400">
            No offers yet. Create one — e.g. “Diwali Offer · 20% off · 25 Oct – 5 Nov”.
          </div>
        )}

        <div className="space-y-3">
          {q.data?.map((o) => {
            const st = offerStatus(o);
            return (
              <article key={o.id} className="rounded-2xl border border-gray-200/60 bg-white p-5 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="font-bold text-slate-900">
                      <Icon name="tags" aria-hidden="true" className="mr-1.5 text-gold" />
                      {o.name}
                      <span className="ml-2 align-middle text-sm font-extrabold text-gold">
                        {o.discountType === 'PERCENT' ? `${Number(o.discountValue)}% off` : `${inr(o.discountValue)} off`}
                      </span>
                    </h2>
                    {o.description && <p className="mt-0.5 text-sm text-slate-500">{o.description}</p>}
                    <p className="mt-1.5 text-xs text-slate-400">
                      {new Date(o.startsAt).toLocaleDateString()} → {new Date(o.endsAt).toLocaleDateString()}
                      {' · '}
                      Applies to: <b className="text-slate-600">{o.planName ?? 'All plans'}</b>
                      {' / '}
                      <b className="text-slate-600">{o.durationDays ? `${o.durationDays} days` : 'all durations'}</b>
                    </p>
                  </div>
                  <span className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold ${st.cls}`}>{st.label}</span>
                </div>
                <div className="mt-3 flex flex-wrap gap-3 border-t border-gray-100 pt-3 text-xs font-semibold">
                  <button
                    onClick={() =>
                      setForm({
                        id: o.id,
                        name: o.name,
                        description: o.description ?? '',
                        discountType: o.discountType,
                        discountValue: String(Number(o.discountValue)),
                        planName: o.planName ?? '',
                        durationDays: o.durationDays ? String(o.durationDays) : '',
                        startsAt: toLocal(o.startsAt),
                        endsAt: toLocal(o.endsAt),
                        active: o.active,
                      })
                    }
                    className="text-navy hover:text-gold"
                  >
                    Edit
                  </button>
                  <button onClick={() => toggleM.mutate(o)} className="text-amber-600 hover:underline">
                    {o.active ? 'Disable' : 'Enable'}
                  </button>
                  <button
                    onClick={() => { if (confirm(`Delete “${o.name}”?`)) deleteM.mutate(o.id); }}
                    className="text-rose-500 hover:underline"
                  >
                    Delete
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      </div>

      {form && (
        <div role="dialog" aria-modal="true" aria-labelledby="offer-form-title" className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setForm(null)} />
          <div className="relative max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
            <h3 id="offer-form-title" className="mb-4 text-lg font-bold text-navy">
              {form.id ? 'Edit offer' : 'New offer'}
            </h3>

            <label htmlFor="of-name" className="mb-1.5 block text-xs font-bold uppercase text-slate-500">Name</label>
            <input id="of-name" value={form.name} placeholder="e.g. Diwali Offer" onChange={(e) => setForm({ ...form, name: e.target.value })} className="mb-3 w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:border-gold focus:outline-none" />

            <label htmlFor="of-desc" className="mb-1.5 block text-xs font-bold uppercase text-slate-500">Description <span className="font-medium normal-case text-slate-400">(optional)</span></label>
            <input id="of-desc" value={form.description} placeholder="Shown on the pricing page" onChange={(e) => setForm({ ...form, description: e.target.value })} className="mb-3 w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:border-gold focus:outline-none" />

            <div className="mb-3 grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="of-type" className="mb-1.5 block text-xs font-bold uppercase text-slate-500">Discount type</label>
                <select id="of-type" value={form.discountType} onChange={(e) => setForm({ ...form, discountType: e.target.value as OfferDiscountType })} className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm focus:border-gold focus:outline-none">
                  <option value="PERCENT">Percent (%)</option>
                  <option value="FLAT">Flat (₹)</option>
                </select>
              </div>
              <div>
                <label htmlFor="of-value" className="mb-1.5 block text-xs font-bold uppercase text-slate-500">Value</label>
                <input id="of-value" type="number" min={0} max={form.discountType === 'PERCENT' ? 100 : undefined} value={form.discountValue} placeholder={form.discountType === 'PERCENT' ? 'e.g. 20' : 'e.g. 500'} onChange={(e) => setForm({ ...form, discountValue: e.target.value })} className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:border-gold focus:outline-none" />
              </div>
            </div>

            <div className="mb-3 grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="of-plan" className="mb-1.5 block text-xs font-bold uppercase text-slate-500">Plan</label>
                <select id="of-plan" value={form.planName} onChange={(e) => setForm({ ...form, planName: e.target.value })} className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm focus:border-gold focus:outline-none">
                  <option value="">All plans</option>
                  <option value="BASIC">Basic</option>
                  <option value="PREMIUM">Premium</option>
                </select>
              </div>
              <div>
                <label htmlFor="of-duration" className="mb-1.5 block text-xs font-bold uppercase text-slate-500">Duration (days)</label>
                <input id="of-duration" type="number" min={1} value={form.durationDays} placeholder="Blank = all" onChange={(e) => setForm({ ...form, durationDays: e.target.value })} className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:border-gold focus:outline-none" />
              </div>
            </div>

            <div className="mb-3 grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="of-start" className="mb-1.5 block text-xs font-bold uppercase text-slate-500">Starts</label>
                <input id="of-start" type="datetime-local" value={form.startsAt} onChange={(e) => setForm({ ...form, startsAt: e.target.value })} className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:border-gold focus:outline-none" />
              </div>
              <div>
                <label htmlFor="of-end" className="mb-1.5 block text-xs font-bold uppercase text-slate-500">Ends</label>
                <input id="of-end" type="datetime-local" value={form.endsAt} onChange={(e) => setForm({ ...form, endsAt: e.target.value })} className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:border-gold focus:outline-none" />
              </div>
            </div>

            <label className="mb-4 flex items-center gap-2 text-sm text-slate-600">
              <input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} className="rounded border-gray-300 text-gold focus:ring-gold" />
              Enabled (runs automatically during its window)
            </label>

            <div className="flex justify-end gap-2">
              <button onClick={() => setForm(null)} className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-slate-600">Cancel</button>
              <button
                onClick={() => { setError(''); saveM.mutate(); }}
                disabled={saveM.isPending || !form.name || !form.discountValue || !form.startsAt || !form.endsAt}
                className="rounded-xl bg-gold px-5 py-2 text-sm font-bold text-navy disabled:opacity-50"
              >
                {saveM.isPending ? 'Saving…' : 'Save offer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
