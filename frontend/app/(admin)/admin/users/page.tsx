'use client';

import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import {
  adminCreateUser,
  adminDeleteUser,
  adminEraseUser,
  adminExportUserData,
  adminResetUserPassword,
  adminUpdateUser,
  fetchUsers,
  setUserStatus,
  type AdminUser,
} from '@/lib/api/admin';
import { getMe } from '@/lib/api/users';
import AdminPageHeader from '@/components/site/AdminPageHeader';
import Pagination from '@/components/ui/Pagination';
import Icon from '@/components/ui/Icon';

const stBadge: Record<string, string> = {
  ACTIVE: 'bg-green-50 text-green-700',
  SUSPENDED: 'bg-orange-50 text-orange-700',
  DELETED: 'bg-rose-50 text-rose-600',
};

interface UserForm {
  id: string | null; // null = create
  fullName: string;
  email: string;
  mobile: string;
  role: 'CLIENT' | 'LAWYER' | 'ADMIN';
  adminRole: 'SUPER' | 'OPS' | 'FINANCE';
}

const EMPTY: UserForm = { id: null, fullName: '', email: '', mobile: '', role: 'CLIENT', adminRole: 'OPS' };

export default function AdminUsersPage() {
  const qc = useQueryClient();
  const [role, setRole] = useState('');
  const [search, setSearch] = useState('');
  const [q10, setQ10] = useState(''); // debounced value used in the query
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState<'newest' | 'name' | 'mobile' | 'status'>('newest');
  const [form, setForm] = useState<UserForm | null>(null);
  const [tempPw, setTempPw] = useState<{ email: string; password: string } | null>(null);
  const [error, setError] = useState('');

  const meQ = useQuery({ queryKey: ['me'], queryFn: getMe, staleTime: 300_000 });
  const isSuper = (meQ.data?.adminRole ?? 'SUPER') === 'SUPER';

  const q = useQuery({
    queryKey: ['admin-users', role, q10, page, sort],
    queryFn: () => fetchUsers(role || undefined, undefined, q10 || undefined, page, 20, sort),
    placeholderData: keepPreviousData,
  });
  const users = q.data?.items ?? [];
  const invalidate = () => qc.invalidateQueries({ queryKey: ['admin-users'] });

  const statusM = useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'ACTIVE' | 'SUSPENDED' }) => setUserStatus(id, status),
    onSuccess: invalidate,
    onError: (e: Error) => setError(e.message),
  });

  const saveM = useMutation({
    mutationFn: async () => {
      const f = form!;
      if (f.id) {
        await adminUpdateUser(f.id, { fullName: f.fullName, email: f.email, mobile: f.mobile });
        return null;
      }
      const res = await adminCreateUser({
        fullName: f.fullName,
        email: f.email,
        mobile: f.mobile,
        role: f.role,
        ...(f.role === 'ADMIN' ? { adminRole: f.adminRole } : {}),
      });
      return res.tempPassword ? { email: f.email, password: res.tempPassword } : null;
    },
    onSuccess: (pw) => {
      setForm(null);
      if (pw) setTempPw(pw);
      invalidate();
    },
    onError: (e: Error) => setError(e.message),
  });

  const resetM = useMutation({
    mutationFn: async (u: AdminUser) => {
      const res = await adminResetUserPassword(u.id);
      return { email: u.email, password: res.tempPassword };
    },
    onSuccess: (pw) => setTempPw(pw),
    onError: (e: Error) => setError(e.message),
  });

  const exportM = useMutation({
    mutationFn: async (u: AdminUser) => {
      const data = await adminExportUserData(u.id);
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `lawmitran-data-export-${u.email}.json`;
      a.click();
      URL.revokeObjectURL(a.href);
    },
    onError: (e: Error) => setError(e.message),
  });

  const eraseM = useMutation({
    mutationFn: (id: string) => adminEraseUser(id),
    onSuccess: invalidate,
    onError: (e: Error) => setError(e.message),
  });

  const deleteM = useMutation({
    mutationFn: (id: string) => adminDeleteUser(id),
    onSuccess: invalidate,
    onError: (e: Error) => setError(e.message),
  });

  return (
    <div>
      <AdminPageHeader
        title="Users"
        subtitle="Clients & admin accounts. Lawyers are managed under the Lawyers tab."
      />
      <div className="p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <button
            onClick={() => { setError(''); setForm(EMPTY); }}
            className="rounded-xl bg-navy px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
          >
            <Icon name="plus" aria-hidden="true" className="mr-1 text-xs" /> Add client
          </button>
          <div className="relative flex-1 sm:max-w-xs">
            <Icon name="magnifying-glass" aria-hidden="true" className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400" />
            <input
              type="search"
              aria-label="Search users by name, email, or mobile"
              value={search}
              onChange={(e) => {
                const v = e.target.value;
                setSearch(v);
                // light debounce
                setTimeout(() => setQ10((prev) => {
                  if (v === prev) return prev;
                  setPage(1);
                  return v;
                }), 300);
              }}
              placeholder="Search name, email, mobile…"
              className="w-full rounded-xl border border-gray-200 py-2 pl-9 pr-3 text-sm focus:border-gold focus:outline-none"
            />
          </div>
          <select
            aria-label="Sort users"
            value={sort}
            onChange={(e) => { setSort(e.target.value as typeof sort); setPage(1); }}
            className="rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-gold focus:outline-none"
          >
            <option value="newest">Newest</option>
            <option value="name">Name (A–Z)</option>
            <option value="mobile">Mobile</option>
            <option value="status">Status</option>
          </select>
          <select
            aria-label="Filter by role"
            value={role}
            onChange={(e) => { setRole(e.target.value); setPage(1); }}
            className="rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-gold focus:outline-none"
          >
            <option value="">All (clients & admins)</option>
            <option value="CLIENT">Clients</option>
            <option value="ADMIN">Admins</option>
          </select>
        </div>

        {error && (
          <p role="alert" className="mb-4 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>
        )}

        <div className="overflow-hidden rounded-2xl border border-gray-200/60 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-[11px] uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-5 py-3 text-left font-bold">Name</th>
                  <th className="px-5 py-3 text-left font-bold">Email</th>
                  <th className="px-5 py-3 text-left font-bold">Mobile</th>
                  <th className="px-5 py-3 text-left font-bold">Role</th>
                  <th className="px-5 py-3 text-left font-bold">Status</th>
                  <th className="px-5 py-3 text-right font-bold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {users.map((u: AdminUser) => (
                  <tr key={u.id} className="hover:bg-slate-50">
                    <td className="px-5 py-3 font-semibold text-slate-800">{u.fullName ?? '—'}</td>
                    <td className="px-5 py-3 text-slate-600">{u.email}</td>
                    <td className="px-5 py-3 text-slate-500">{u.mobile}</td>
                    <td className="px-5 py-3 text-slate-600">{u.role}</td>
                    <td className="px-5 py-3">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${stBadge[u.status]}`}>{u.status}</span>
                    </td>
                    <td className="space-x-3 whitespace-nowrap px-5 py-3 text-right text-xs font-semibold">
                      {u.role !== 'ADMIN' && (
                        <>
                          <button
                            onClick={() => {
                              setError('');
                              setForm({
                                id: u.id,
                                fullName: u.fullName ?? '',
                                email: u.email,
                                mobile: u.mobile,
                                role: u.role,
                                adminRole: 'OPS',
                              });
                            }}
                            className="text-navy hover:text-gold"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => { setError(''); resetM.mutate(u); }}
                            className="text-slate-500 hover:text-navy"
                          >
                            Reset password
                          </button>
                          {u.status === 'ACTIVE' && (
                            <button onClick={() => statusM.mutate({ id: u.id, status: 'SUSPENDED' })} className="text-orange-600 hover:underline">
                              Suspend
                            </button>
                          )}
                          {u.status === 'SUSPENDED' && (
                            <button onClick={() => statusM.mutate({ id: u.id, status: 'ACTIVE' })} className="text-green-600 hover:underline">
                              Reactivate
                            </button>
                          )}
                          {u.status !== 'DELETED' && (
                            <button
                              onClick={() => {
                                if (confirm(`Soft-delete ${u.email}? They will be signed out everywhere.`)) {
                                  setError('');
                                  deleteM.mutate(u.id);
                                }
                              }}
                              className="text-rose-500 hover:underline"
                            >
                              Delete
                            </button>
                          )}
                          <button
                            onClick={() => { setError(''); exportM.mutate(u); }}
                            title="DPDP: download all personal data as JSON"
                            className="text-slate-500 hover:text-navy"
                          >
                            {exportM.isPending && exportM.variables?.id === u.id ? 'Exporting…' : 'Export'}
                          </button>
                          {u.status === 'DELETED' && isSuper && (
                            <button
                              onClick={() => {
                                if (confirm(`Erase all PII for ${u.email}? This is irreversible — financial records are retained.`)) {
                                  setError('');
                                  eraseM.mutate(u.id);
                                }
                              }}
                              className="text-rose-600 hover:underline"
                            >
                              Erase PII
                            </button>
                          )}
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {q.isLoading && <p role="status" className="p-6 text-center text-sm text-slate-400">Loading…</p>}
          {!q.isLoading && users.length === 0 && <p className="p-6 text-center text-sm text-slate-400">No users.</p>}
          {q.data && (
            <Pagination
              page={q.data.page}
              totalPages={q.data.totalPages}
              total={q.data.total}
              pageSize={q.data.pageSize}
              onPageChange={setPage}
              label="user"
            />
          )}
        </div>
      </div>

      {/* create / edit modal */}
      {form && (
        <div role="dialog" aria-modal="true" aria-labelledby="user-form-title" className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setForm(null)} />
          <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h3 id="user-form-title" className="mb-1 text-lg font-bold text-navy">
              {form.id ? 'Edit user' : 'Add client'}
            </h3>
            <p className="mb-5 text-xs text-slate-500">
              {form.id
                ? 'Update the account details.'
                : 'Account is created pre-verified; a one-time temporary password is shown after saving.'}
            </p>


            {!form.id && isSuper && (
              <div className="mb-4">
                <div role="radiogroup" aria-label="Account type" className="grid grid-cols-2 gap-3">
                  {([['CLIENT', 'Client'], ['ADMIN', 'Staff admin']] as const).map(([r, label]) => (
                    <button
                      key={r}
                      type="button"
                      role="radio"
                      aria-checked={form.role === r}
                      onClick={() => setForm({ ...form, role: r })}
                      className={`rounded-xl border p-3 text-sm font-bold ${
                        form.role === r ? 'border-gold bg-amber-50/60 text-navy' : 'border-gray-200 text-slate-500'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
                {form.role === 'ADMIN' && (
                  <div className="mt-3">
                    <label htmlFor="uf-adminrole" className="mb-1.5 block text-xs font-bold uppercase text-slate-500">Staff role</label>
                    <select
                      id="uf-adminrole"
                      value={form.adminRole}
                      onChange={(e) => setForm({ ...form, adminRole: e.target.value as UserForm['adminRole'] })}
                      className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm focus:border-gold focus:outline-none"
                    >
                      <option value="OPS">Ops — lawyers, users, queries, moderation</option>
                      <option value="FINANCE">Finance — plans, offers, transactions</option>
                      <option value="SUPER">Super — full access incl. settings</option>
                    </select>
                  </div>
                )}
              </div>
            )}

            <label htmlFor="uf-name" className="mb-1.5 block text-xs font-bold uppercase text-slate-500">Full name</label>
            <input id="uf-name" value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} className="mb-3 w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:border-gold focus:outline-none" />

            <label htmlFor="uf-email" className="mb-1.5 block text-xs font-bold uppercase text-slate-500">Email</label>
            <input id="uf-email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="mb-3 w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:border-gold focus:outline-none" />

            <label htmlFor="uf-mobile" className="mb-1.5 block text-xs font-bold uppercase text-slate-500">Mobile</label>
            <input id="uf-mobile" type="tel" value={form.mobile} placeholder="+919876543210" onChange={(e) => setForm({ ...form, mobile: e.target.value })} className="mb-4 w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:border-gold focus:outline-none" />


            <div className="flex justify-end gap-2">
              <button onClick={() => setForm(null)} className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-slate-600">Cancel</button>
              <button
                onClick={() => { setError(''); saveM.mutate(); }}
                disabled={saveM.isPending || form.fullName.trim().length < 2 || !form.email || !form.mobile}
                className="rounded-xl bg-gold px-5 py-2 text-sm font-bold text-navy disabled:opacity-50"
              >
                {saveM.isPending ? 'Saving…' : form.id ? 'Save changes' : 'Create client'}
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
