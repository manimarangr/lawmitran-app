'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import {
  createPlanTier,
  deletePlanTier,
  fetchAllPlanTiers,
  fetchPlanPrices,
  setPlanPrice,
  updatePlanTier,
  type AdminPlanTier,
  type PlanPrice,
} from '@/lib/api/admin';
import type { PlanName } from '@/types/subscription';
import AdminPageHeader from '@/components/site/AdminPageHeader';
import Icon from '@/components/ui/Icon';

const inr = (n: number | string) => '₹' + Number(n).toLocaleString('en-IN');

interface TierForm {
  planName: string;
  durationDays: string;
  amount: string;
  label: string;
  active: boolean;
  isNew: boolean;
}

export default function AdminPlansPage() {
  const qc = useQueryClient();
  const pricesQ = useQuery({ queryKey: ['admin-plans'], queryFn: fetchPlanPrices });
  const tiersQ = useQuery({ queryKey: ['admin-tiers'], queryFn: fetchAllPlanTiers });

  const [edit, setEdit] = useState<{ plan: string; amount: string; cap: string; areas: string } | null>(null);
  const [tierForm, setTierForm] = useState<TierForm | null>(null);
  const [error, setError] = useState('');

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['admin-plans'] });
    qc.invalidateQueries({ queryKey: ['admin-tiers'] });
  };

  const priceM = useMutation({
    mutationFn: () =>
      setPlanPrice(
        edit!.plan as PlanName,
        Number(edit!.amount),
        edit!.cap === '' ? null : Number(edit!.cap),
        edit!.areas === '' ? null : Number(edit!.areas),
      ),
    onSuccess: () => { setEdit(null); invalidate(); },
    onError: (e: Error) => setError(e.message),
  });

  const tierM = useMutation({
    mutationFn: () => {
      const f = tierForm!;
      return f.isNew
        ? createPlanTier(f.planName, {
            durationDays: Number(f.durationDays),
            amount: Number(f.amount),
            label: f.label || undefined,
            active: f.active,
          })
        : updatePlanTier(f.planName, Number(f.durationDays), {
            amount: Number(f.amount),
            label: f.label || undefined,
            active: f.active,
          });
    },
    onSuccess: () => { setTierForm(null); invalidate(); },
    onError: (e: Error) => setError(e.message),
  });

  const toggleM = useMutation({
    mutationFn: (t: AdminPlanTier) =>
      updatePlanTier(t.planName, t.durationDays, { amount: Number(t.amount), active: !t.active }),
    onSuccess: invalidate,
    onError: (e: Error) => setError(e.message),
  });

  const deleteM = useMutation({
    mutationFn: (t: AdminPlanTier) => deletePlanTier(t.planName, t.durationDays),
    onSuccess: invalidate,
    onError: (e: Error) => setError(e.message),
  });

  const plans = ['BASIC', 'PREMIUM'];
  const tiersOf = (plan: string) => (tiersQ.data ?? []).filter((t) => t.planName === plan);

  return (
    <div>
      <AdminPageHeader
        title="Plans"
        subtitle="Configure prices, durations, and lead caps — changes go live immediately."
      />
      <div className="space-y-8 p-6">
        {error && (
          <p role="alert" className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">
            {error}
          </p>
        )}
        {(pricesQ.isLoading || tiersQ.isLoading) && (
          <p role="status" className="text-sm text-slate-400">Loading…</p>
        )}

        {plans.map((plan) => {
          const price = pricesQ.data?.find((p: PlanPrice) => p.planName === plan);
          const tiers = tiersOf(plan);
          return (
            <section key={plan} aria-labelledby={`plan-${plan}`} className="rounded-2xl border border-gray-200/60 bg-white shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 p-5">
                <div>
                  <h2 id={`plan-${plan}`} className="text-lg font-bold capitalize text-navy">
                    {plan.toLowerCase()}
                    {plan === 'PREMIUM' && <Icon name="crown" aria-hidden="true" className="ml-2 text-gold" />}
                  </h2>
                  <p className="text-xs text-slate-400">
                    Base {price ? `${inr(price.amount)}/mo` : '—'} · Lead cap:{' '}
                    {price ? (price.monthlyLeadCap === null ? 'Unlimited' : `${price.monthlyLeadCap}/mo`) : '—'}
                    {' · '}Service areas:{' '}
                    {price ? (price.maxServiceAreas === null ? 'Unlimited' : price.maxServiceAreas) : '—'}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() =>
                      setEdit({
                        plan,
                        amount: price ? String(price.amount) : '',
                        cap: price?.monthlyLeadCap === null || !price ? '' : String(price.monthlyLeadCap),
                        areas: price?.maxServiceAreas === null || !price ? '' : String(price.maxServiceAreas),
                      })
                    }
                    className="rounded-xl border border-gray-200 px-3.5 py-2 text-sm font-semibold text-navy hover:border-gold"
                  >
                    <Icon name="pen" aria-hidden="true" className="mr-1 text-xs" /> Base price &amp; cap
                  </button>
                  <button
                    onClick={() =>
                      setTierForm({ planName: plan, durationDays: '', amount: '', label: '', active: true, isNew: true })
                    }
                    className="rounded-xl bg-navy px-3.5 py-2 text-sm font-semibold text-white hover:bg-slate-800"
                  >
                    <Icon name="plus" aria-hidden="true" className="mr-1 text-xs" /> Add duration
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 text-[11px] uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-5 py-3 text-left font-bold">Duration</th>
                      <th className="px-5 py-3 text-left font-bold">Label</th>
                      <th className="px-5 py-3 text-left font-bold">Price</th>
                      <th className="px-5 py-3 text-left font-bold">Status</th>
                      <th className="px-5 py-3 text-right font-bold">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {tiers.map((t) => (
                      <tr key={t.id} className="hover:bg-slate-50">
                        <td className="px-5 py-3 font-semibold text-slate-800">{t.durationDays} days</td>
                        <td className="px-5 py-3 text-slate-600">{t.label}</td>
                        <td className="px-5 py-3 font-bold text-navy">{inr(t.amount)}</td>
                        <td className="px-5 py-3">
                          <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${t.active ? 'bg-green-50 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                            {t.active ? 'Active' : 'Hidden'}
                          </span>
                        </td>
                        <td className="space-x-3 px-5 py-3 text-right text-xs font-semibold">
                          <button
                            onClick={() =>
                              setTierForm({
                                planName: t.planName,
                                durationDays: String(t.durationDays),
                                amount: String(t.amount),
                                label: t.label,
                                active: t.active,
                                isNew: false,
                              })
                            }
                            className="text-navy hover:text-gold"
                          >
                            Edit
                          </button>
                          <button onClick={() => toggleM.mutate(t)} className="text-amber-600 hover:underline">
                            {t.active ? 'Disable' : 'Enable'}
                          </button>
                          <button
                            onClick={() => { if (confirm(`Delete the ${t.durationDays}-day tier for ${plan}?`)) deleteM.mutate(t); }}
                            className="text-rose-500 hover:underline"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                    {tiers.length === 0 && !tiersQ.isLoading && (
                      <tr>
                        <td colSpan={5} className="px-5 py-6 text-center text-sm text-slate-400">
                          No duration tiers yet — add one so lawyers can buy this plan.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          );
        })}

        <p className="text-xs text-slate-400">
          The lawyer pricing page renders whatever tiers are <b>Active</b> here. Seasonal discounts
          are managed on the <a href="/admin/offers" className="font-semibold text-navy hover:text-gold">Offers</a> page.
        </p>
      </div>

      {/* base price modal */}
      {edit && (
        <div role="dialog" aria-modal="true" aria-labelledby="plan-edit-title" className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setEdit(null)} />
          <div className="relative w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            <h3 id="plan-edit-title" className="mb-4 text-lg font-bold capitalize text-navy">
              {edit.plan.toLowerCase()} — base price &amp; lead cap
            </h3>
            <label htmlFor="plan-price" className="mb-1.5 block text-xs font-bold uppercase text-slate-500">Base price (₹/mo)</label>
            <input id="plan-price" type="number" min={0} value={edit.amount} onChange={(e) => setEdit({ ...edit, amount: e.target.value })} className="mb-3 w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:border-gold focus:outline-none" />
            <label htmlFor="plan-cap" className="mb-1.5 block text-xs font-bold uppercase text-slate-500">Monthly lead cap</label>
            <input id="plan-cap" type="number" min={0} value={edit.cap} placeholder="Blank = unlimited" onChange={(e) => setEdit({ ...edit, cap: e.target.value })} className="mb-3 w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:border-gold focus:outline-none" />
            <label htmlFor="plan-areas" className="mb-1.5 block text-xs font-bold uppercase text-slate-500">Max service areas</label>
            <input id="plan-areas" type="number" min={1} value={edit.areas} placeholder="Blank = unlimited" onChange={(e) => setEdit({ ...edit, areas: e.target.value })} className="mb-4 w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:border-gold focus:outline-none" />
            <div className="flex justify-end gap-2">
              <button onClick={() => setEdit(null)} className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-slate-600">Cancel</button>
              <button onClick={() => { setError(''); priceM.mutate(); }} disabled={priceM.isPending || edit.amount === ''} className="rounded-xl bg-gold px-5 py-2 text-sm font-bold text-navy disabled:opacity-50">Save</button>
            </div>
          </div>
        </div>
      )}

      {/* tier modal */}
      {tierForm && (
        <div role="dialog" aria-modal="true" aria-labelledby="tier-edit-title" className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setTierForm(null)} />
          <div className="relative w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            <h3 id="tier-edit-title" className="mb-4 text-lg font-bold capitalize text-navy">
              {tierForm.isNew ? `New ${tierForm.planName.toLowerCase()} duration` : `Edit ${tierForm.planName.toLowerCase()} · ${tierForm.durationDays} days`}
            </h3>
            <label htmlFor="tier-days" className="mb-1.5 block text-xs font-bold uppercase text-slate-500">Duration (days)</label>
            <input
              id="tier-days" type="number" min={1} value={tierForm.durationDays}
              disabled={!tierForm.isNew}
              onChange={(e) => setTierForm({ ...tierForm, durationDays: e.target.value })}
              placeholder="e.g. 60"
              className="mb-3 w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:border-gold focus:outline-none disabled:bg-slate-50 disabled:text-slate-400"
            />
            <label htmlFor="tier-amount" className="mb-1.5 block text-xs font-bold uppercase text-slate-500">Total price (₹)</label>
            <input id="tier-amount" type="number" min={0} value={tierForm.amount} onChange={(e) => setTierForm({ ...tierForm, amount: e.target.value })} className="mb-3 w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:border-gold focus:outline-none" />
            <label htmlFor="tier-label" className="mb-1.5 block text-xs font-bold uppercase text-slate-500">Label <span className="font-medium normal-case text-slate-400">(optional, e.g. “2 months”)</span></label>
            <input id="tier-label" type="text" value={tierForm.label} onChange={(e) => setTierForm({ ...tierForm, label: e.target.value })} className="mb-3 w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:border-gold focus:outline-none" />
            <label className="mb-4 flex items-center gap-2 text-sm text-slate-600">
              <input type="checkbox" checked={tierForm.active} onChange={(e) => setTierForm({ ...tierForm, active: e.target.checked })} className="rounded border-gray-300 text-gold focus:ring-gold" />
              Visible on the pricing page
            </label>
            <div className="flex justify-end gap-2">
              <button onClick={() => setTierForm(null)} className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-slate-600">Cancel</button>
              <button
                onClick={() => { setError(''); tierM.mutate(); }}
                disabled={tierM.isPending || tierForm.amount === '' || tierForm.durationDays === ''}
                className="rounded-xl bg-gold px-5 py-2 text-sm font-bold text-navy disabled:opacity-50"
              >
                {tierM.isPending ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
