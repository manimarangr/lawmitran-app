'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import {
  createPracticeArea,
  deletePracticeArea,
  fetchAdminPracticeAreas,
  renamePracticeArea,
  type AdminPracticeArea,
} from '@/lib/api/admin';
import AdminPageHeader from '@/components/site/AdminPageHeader';
import Icon from '@/components/ui/Icon';

export default function AdminPracticeAreasPage() {
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ['admin-practice-areas'], queryFn: fetchAdminPracticeAreas });
  const [newName, setNewName] = useState('');
  const [rename, setRename] = useState<{ id: string; name: string } | null>(null);
  const [error, setError] = useState('');

  const invalidate = () => qc.invalidateQueries({ queryKey: ['admin-practice-areas'] });

  const createM = useMutation({
    mutationFn: () => createPracticeArea(newName.trim()),
    onSuccess: () => { setNewName(''); invalidate(); },
    onError: (e: Error) => setError(e.message),
  });
  const renameM = useMutation({
    mutationFn: () => renamePracticeArea(rename!.id, rename!.name.trim()),
    onSuccess: () => { setRename(null); invalidate(); },
    onError: (e: Error) => setError(e.message),
  });
  const deleteM = useMutation({
    mutationFn: (id: string) => deletePracticeArea(id),
    onSuccess: invalidate,
    onError: (e: Error) => setError(e.message),
  });

  return (
    <div>
      <AdminPageHeader
        title="Practice Areas"
        subtitle="Reference list powering search filters, the homepage grid, onboarding chips, and SEO hub pages."
      />
      <div className="p-6">
        {/* add */}
        <form
          onSubmit={(e) => { e.preventDefault(); setError(''); if (newName.trim()) createM.mutate(); }}
          className="mb-6 flex max-w-xl gap-2"
        >
          <label htmlFor="pa-new" className="sr-only">New practice area name</label>
          <input
            id="pa-new"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="e.g. Environmental Law"
            className="flex-1 rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm focus:border-gold focus:outline-none"
          />
          <button
            type="submit"
            disabled={createM.isPending || newName.trim().length < 2}
            className="rounded-xl bg-navy px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
          >
            <Icon name="plus" aria-hidden="true" className="mr-1 text-xs" /> Add area
          </button>
        </form>

        {error && (
          <p role="alert" className="mb-4 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>
        )}
        {q.isLoading && <p role="status" className="text-sm text-slate-400">Loading…</p>}

        <div className="overflow-hidden rounded-2xl border border-gray-200/60 bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-[11px] uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-5 py-3 text-left font-bold">Name</th>
                <th className="px-5 py-3 text-left font-bold">Slug (SEO)</th>
                <th className="px-5 py-3 text-left font-bold">Lawyers</th>
                <th className="px-5 py-3 text-right font-bold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {q.data?.map((a: AdminPracticeArea) => (
                <tr key={a.id} className="hover:bg-slate-50">
                  <td className="px-5 py-3 font-semibold text-slate-800">{a.name}</td>
                  <td className="px-5 py-3 font-mono text-xs text-slate-500">/{a.slug}</td>
                  <td className="px-5 py-3 text-slate-600">{a.lawyerCount}</td>
                  <td className="space-x-3 px-5 py-3 text-right text-xs font-semibold">
                    <button onClick={() => setRename({ id: a.id, name: a.name })} className="text-navy hover:text-gold">
                      Rename
                    </button>
                    <button
                      onClick={() => { if (confirm(`Delete “${a.name}”?`)) { setError(''); deleteM.mutate(a.id); } }}
                      disabled={a.lawyerCount > 0}
                      title={a.lawyerCount > 0 ? 'In use by lawyers — cannot delete' : undefined}
                      className="text-rose-500 hover:underline disabled:cursor-not-allowed disabled:text-slate-300"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
              {q.data?.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-5 py-8 text-center text-sm text-slate-400">
                    No practice areas yet — add the first one above.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <p className="mt-4 text-xs text-slate-400">
          Renaming keeps the slug (and its SEO landing URLs) stable. Deleting is only possible when no
          lawyer lists the area.
        </p>
      </div>

      {rename && (
        <div role="dialog" aria-modal="true" aria-labelledby="pa-rename-title" className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setRename(null)} />
          <div className="relative w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            <h3 id="pa-rename-title" className="mb-4 text-lg font-bold text-navy">Rename practice area</h3>
            <label htmlFor="pa-rename" className="mb-1.5 block text-xs font-bold uppercase text-slate-500">Name</label>
            <input
              id="pa-rename"
              value={rename.name}
              onChange={(e) => setRename({ ...rename, name: e.target.value })}
              className="mb-4 w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:border-gold focus:outline-none"
            />
            <div className="flex justify-end gap-2">
              <button onClick={() => setRename(null)} className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-slate-600">Cancel</button>
              <button
                onClick={() => { setError(''); renameM.mutate(); }}
                disabled={renameM.isPending || rename.name.trim().length < 2}
                className="rounded-xl bg-gold px-5 py-2 text-sm font-bold text-navy disabled:opacity-50"
              >
                {renameM.isPending ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
