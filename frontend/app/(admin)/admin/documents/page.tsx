'use client';

import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import Link from 'next/link';
import {
  createDocCategory,
  createDocTemplate,
  fetchAdminDocCategories,
  fetchAdminDocOrders,
  fetchAdminDocTemplates,
  setDocTemplateStatus,
  updateDocCategory,
  type AdminDocTemplate,
} from '@/lib/api/documents';
import AdminPageHeader from '@/components/site/AdminPageHeader';
import Icon from '@/components/ui/Icon';
import Pagination from '@/components/ui/Pagination';

const STATUS_CHIP: Record<string, string> = {
  DRAFT: 'bg-slate-100 text-slate-500',
  PUBLISHED: 'bg-green-50 text-green-700',
  ARCHIVED: 'bg-rose-50 text-rose-600',
};

export default function AdminDocumentsPage() {
  const qc = useQueryClient();
  const [tab, setTab] = useState<'templates' | 'categories' | 'orders'>('templates');
  const [page, setPage] = useState(1);
  const [error, setError] = useState('');
  const [catForm, setCatForm] = useState<{ id: string | null; name: string; description: string } | null>(null);
  const [newTitle, setNewTitle] = useState('');

  const templatesQ = useQuery({ queryKey: ['admin-doc-templates'], queryFn: fetchAdminDocTemplates });
  const categoriesQ = useQuery({ queryKey: ['admin-doc-categories'], queryFn: fetchAdminDocCategories });
  const ordersQ = useQuery({
    queryKey: ['admin-doc-orders', page],
    queryFn: () => fetchAdminDocOrders(page),
    placeholderData: keepPreviousData,
    enabled: tab === 'orders',
  });

  const statusM = useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED' }) =>
      setDocTemplateStatus(id, status),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-doc-templates'] }),
    onError: (e: Error) => setError(e.message),
  });

  const catM = useMutation({
    mutationFn: async () => {
      const f = catForm!;
      if (f.id) return updateDocCategory(f.id, { name: f.name, description: f.description || undefined });
      return createDocCategory({ name: f.name, description: f.description || undefined });
    },
    onSuccess: () => {
      setCatForm(null);
      qc.invalidateQueries({ queryKey: ['admin-doc-categories'] });
    },
    onError: (e: Error) => setError(e.message),
  });

  const createTplM = useMutation({
    mutationFn: () =>
      createDocTemplate({
        categoryId: categoriesQ.data?.[0]?.id ?? '',
        title: newTitle.trim(),
        price: 199,
        schemaJson: { fields: [{ name: 'fullName', label: 'Full name', type: 'text' }] },
        bodyTemplate: `${newTitle.trim().toUpperCase()}\n\nThis document is made by {{fullName}}.\n\nReplace this body with the full legal text — placeholders use {{fieldName}}.`,
      }),
    onSuccess: (t) => {
      setNewTitle('');
      qc.invalidateQueries({ queryKey: ['admin-doc-templates'] });
      window.location.href = `/admin/documents/${t.id}`;
    },
    onError: (e: Error) => setError(e.message),
  });

  const templates = templatesQ.data ?? [];
  const categories = categoriesQ.data ?? [];

  return (
    <div>
      <AdminPageHeader
        title="Legal Documents"
        subtitle="Template catalog, categories, and purchases — publish a template to put it on sale"
      />
      <div className="p-6">
        <div role="tablist" aria-label="Document sections" className="mb-4 flex gap-1 text-sm font-semibold">
          {(['templates', 'categories', 'orders'] as const).map((t) => (
            <button
              key={t}
              role="tab"
              aria-selected={tab === t}
              onClick={() => setTab(t)}
              className={`rounded-xl px-4 py-1.5 capitalize ${tab === t ? 'bg-navy text-white' : 'text-slate-500 hover:bg-slate-100'}`}
            >
              {t}
            </button>
          ))}
        </div>

        {error && <p role="alert" className="mb-4 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}

        {/* ===== templates ===== */}
        {tab === 'templates' && (
          <>
            <div className="mb-4 flex flex-wrap gap-2">
              <input
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="New template title, e.g. Rental Agreement"
                aria-label="New template title"
                className="w-72 rounded-xl border border-gray-200 bg-white px-3.5 py-2 text-sm focus:border-gold focus:outline-none"
              />
              <button
                onClick={() => { setError(''); createTplM.mutate(); }}
                disabled={createTplM.isPending || newTitle.trim().length < 3 || categories.length === 0}
                className="rounded-xl bg-navy px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
              >
                <Icon name="plus" aria-hidden="true" className="mr-1 text-xs" />
                {createTplM.isPending ? 'Creating…' : 'Create draft'}
              </button>
            </div>
            <div className="overflow-hidden rounded-2xl border border-gray-200/60 bg-white shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 text-[11px] uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-5 py-3 text-left font-bold">Template</th>
                      <th className="px-5 py-3 text-left font-bold">Category</th>
                      <th className="px-5 py-3 text-right font-bold">Price</th>
                      <th className="px-5 py-3 text-left font-bold">Status</th>
                      <th className="px-5 py-3 text-right font-bold">Sales</th>
                      <th className="px-5 py-3 text-right font-bold">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {templates.map((t: AdminDocTemplate) => (
                      <tr key={t.id} className="hover:bg-slate-50">
                        <td className="px-5 py-3">
                          <span className="block font-semibold text-slate-800">{t.title}</span>
                          <span className="block text-[11px] text-slate-400">v{t.version} · {t.language} · /{t.slug}</span>
                        </td>
                        <td className="px-5 py-3 text-slate-600">{t.category.name}</td>
                        <td className="px-5 py-3 text-right font-semibold text-slate-800">₹{Number(t.price).toLocaleString('en-IN')}</td>
                        <td className="px-5 py-3">
                          <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${STATUS_CHIP[t.status]}`}>{t.status}</span>
                        </td>
                        <td className="px-5 py-3 text-right text-slate-600">{t._count.documents}</td>
                        <td className="space-x-3 whitespace-nowrap px-5 py-3 text-right text-xs font-semibold">
                          <Link href={`/admin/documents/${t.id}`} className="text-navy hover:text-gold">Edit</Link>
                          {t.status !== 'PUBLISHED' && (
                            <button onClick={() => { setError(''); statusM.mutate({ id: t.id, status: 'PUBLISHED' }); }} className="text-green-600 hover:underline">
                              Publish
                            </button>
                          )}
                          {t.status === 'PUBLISHED' && (
                            <button onClick={() => { setError(''); statusM.mutate({ id: t.id, status: 'ARCHIVED' }); }} className="text-rose-500 hover:underline">
                              Archive
                            </button>
                          )}
                          {t.status === 'ARCHIVED' && (
                            <button onClick={() => { setError(''); statusM.mutate({ id: t.id, status: 'DRAFT' }); }} className="text-slate-500 hover:underline">
                              To draft
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {templatesQ.isLoading && <p role="status" className="p-6 text-center text-sm text-slate-400">Loading…</p>}
              {!templatesQ.isLoading && templates.length === 0 && <p className="p-6 text-center text-sm text-slate-400">No templates yet.</p>}
            </div>
          </>
        )}

        {/* ===== categories ===== */}
        {tab === 'categories' && (
          <>
            <button
              onClick={() => { setError(''); setCatForm({ id: null, name: '', description: '' }); }}
              className="mb-4 rounded-xl bg-navy px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
            >
              <Icon name="plus" aria-hidden="true" className="mr-1 text-xs" /> Add category
            </button>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {categories.map((c) => (
                <div key={c.id} className="rounded-2xl border border-gray-200/60 bg-white p-5 shadow-sm">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-bold text-navy">{c.name}</p>
                      <p className="text-[11px] text-slate-400">/{c.slug} · {c.templateCount} template{c.templateCount === 1 ? '' : 's'}</p>
                    </div>
                    <button
                      onClick={() => setCatForm({ id: c.id, name: c.name, description: c.description ?? '' })}
                      className="text-xs font-semibold text-navy hover:text-gold"
                    >
                      Edit
                    </button>
                  </div>
                  {c.description && <p className="mt-2 text-xs text-slate-500">{c.description}</p>}
                </div>
              ))}
            </div>
          </>
        )}

        {/* ===== orders ===== */}
        {tab === 'orders' && (
          <div className="overflow-hidden rounded-2xl border border-gray-200/60 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-[11px] uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-5 py-3 text-left font-bold">Date</th>
                    <th className="px-5 py-3 text-left font-bold">Buyer</th>
                    <th className="px-5 py-3 text-left font-bold">Document</th>
                    <th className="px-5 py-3 text-right font-bold">Amount</th>
                    <th className="px-5 py-3 text-left font-bold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {(ordersQ.data?.items ?? []).map((o) => (
                    <tr key={o.id} className="hover:bg-slate-50">
                      <td className="whitespace-nowrap px-5 py-3 text-slate-500">{new Date(o.createdAt).toLocaleDateString()}</td>
                      <td className="px-5 py-3">
                        <span className="block font-semibold text-slate-800">{o.user.fullName ?? '—'}</span>
                        <span className="block text-[11px] text-slate-400">{o.user.email}</span>
                      </td>
                      <td className="px-5 py-3 text-slate-600">{o.template.title}</td>
                      <td className="px-5 py-3 text-right font-semibold text-slate-800">
                        {o.amount ? `₹${Number(o.amount).toLocaleString('en-IN')}` : '—'}
                      </td>
                      <td className="px-5 py-3">
                        <span className="rounded-full bg-green-50 px-2.5 py-1 text-[10px] font-bold text-green-700">{o.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {ordersQ.isLoading && <p role="status" className="p-6 text-center text-sm text-slate-400">Loading…</p>}
            {!ordersQ.isLoading && (ordersQ.data?.items.length ?? 0) === 0 && (
              <p className="p-6 text-center text-sm text-slate-400">No purchases yet.</p>
            )}
            {ordersQ.data && (
              <Pagination
                page={ordersQ.data.page}
                totalPages={ordersQ.data.totalPages}
                total={ordersQ.data.total}
                pageSize={ordersQ.data.pageSize}
                onPageChange={setPage}
                label="order"
              />
            )}
          </div>
        )}
      </div>

      {/* category modal */}
      {catForm && (
        <div role="dialog" aria-modal="true" aria-labelledby="cat-form-title" className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setCatForm(null)} />
          <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h3 id="cat-form-title" className="mb-4 text-lg font-bold text-navy">{catForm.id ? 'Edit category' : 'Add category'}</h3>
            <label htmlFor="cf-name" className="mb-1.5 block text-xs font-bold uppercase text-slate-500">Name</label>
            <input id="cf-name" value={catForm.name} onChange={(e) => setCatForm({ ...catForm, name: e.target.value })} className="mb-3 w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:border-gold focus:outline-none" />
            <label htmlFor="cf-desc" className="mb-1.5 block text-xs font-bold uppercase text-slate-500">Description</label>
            <textarea id="cf-desc" rows={2} value={catForm.description} onChange={(e) => setCatForm({ ...catForm, description: e.target.value })} className="mb-4 w-full resize-none rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:border-gold focus:outline-none" />
            <div className="flex justify-end gap-2">
              <button onClick={() => setCatForm(null)} className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-slate-600">Cancel</button>
              <button
                onClick={() => { setError(''); catM.mutate(); }}
                disabled={catM.isPending || catForm.name.trim().length < 2}
                className="rounded-xl bg-gold px-5 py-2 text-sm font-bold text-navy disabled:opacity-50"
              >
                {catM.isPending ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
