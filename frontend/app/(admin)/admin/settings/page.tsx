'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import {
  fetchAdminSettings,
  saveAdminSettings,
  sendTestEmail,
  type AdminSetting,
  type AdminSettingGroup,
} from '@/lib/api/admin';
import AdminPageHeader from '@/components/site/AdminPageHeader';
import Icon from '@/components/ui/Icon';

const inputClass =
  'w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm focus:border-gold focus:outline-none';

function Field({
  s,
  value,
  onChange,
}: {
  s: AdminSetting;
  value: string;
  onChange: (v: string) => void;
}) {
  const id = `set-${s.key}`;
  if (s.type === 'toggle') {
    const on = value === '' ? false : !['false', '0', 'off', 'no'].includes(value.toLowerCase());
    return (
      <label htmlFor={id} className="flex cursor-pointer items-center justify-between rounded-xl border border-gray-200 px-3.5 py-2.5">
        <span className="text-sm text-slate-700">{s.label}</span>
        <input
          id={id}
          type="checkbox"
          checked={on}
          onChange={(e) => onChange(e.target.checked ? 'true' : 'false')}
          className="h-4 w-4 rounded border-gray-300 text-gold focus:ring-gold"
        />
      </label>
    );
  }
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-500">
        {s.label}
        {s.type === 'secret' && s.isSet && (
          <span className="ml-2 rounded-full bg-green-50 px-2 py-0.5 text-[10px] font-bold normal-case text-green-700">
            Saved · hidden
          </span>
        )}
        {s.overridden && s.type !== 'secret' && (
          <span className="ml-2 rounded-full bg-sky-50 px-2 py-0.5 text-[10px] font-bold normal-case text-sky-600">
            Overrides env
          </span>
        )}
      </label>
      {s.type === 'select' ? (
        <select id={id} value={value} onChange={(e) => onChange(e.target.value)} className={`${inputClass} bg-white`}>
          <option value="">— default —</option>
          {(s.options ?? []).map((o) => <option key={o} value={o}>{o}</option>)}
        </select>
      ) : (
        <input
          id={id}
          type={s.type === 'secret' ? 'password' : s.type === 'number' ? 'number' : 'text'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={s.type === 'secret' && s.isSet ? '•••••••• (leave blank to keep)' : s.placeholder}
          autoComplete="off"
          className={inputClass}
        />
      )}
      {s.help && <p className="mt-1 text-[11px] text-slate-400">{s.help}</p>}
    </div>
  );
}

function GroupCard({ group, onSaved }: { group: AdminSettingGroup; onSaved: () => void }) {
  const [values, setValues] = useState<Record<string, string>>({});
  const [dirty, setDirty] = useState<Set<string>>(new Set());
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    setValues(Object.fromEntries(group.settings.map((s) => [s.key, s.value])));
    setDirty(new Set());
  }, [group]);

  const saveM = useMutation({
    mutationFn: () =>
      saveAdminSettings([...dirty].map((key) => ({ key, value: values[key] ?? '' }))),
    onSuccess: () => {
      setMsg('Saved — takes effect within 30 seconds.');
      setError('');
      setDirty(new Set());
      onSaved();
    },
    onError: (e: Error) => { setError(e.message); setMsg(''); },
  });

  const testM = useMutation({
    mutationFn: sendTestEmail,
    onSuccess: (r) => { setMsg(`Test email sent to ${r.to} (check backend logs until SMTP is live).`); setError(''); },
    onError: (e: Error) => { setError(e.message); setMsg(''); },
  });

  function set(key: string, v: string) {
    setValues((prev) => ({ ...prev, [key]: v }));
    setDirty((prev) => new Set(prev).add(key));
    setMsg('');
  }

  return (
    <section aria-labelledby={`g-${group.id}`} className="rounded-2xl border border-gray-200/60 bg-white p-6 shadow-sm">
      <h2 id={`g-${group.id}`} className="text-base font-bold text-navy">{group.title}</h2>
      <p className="mb-4 mt-0.5 text-xs text-slate-400">{group.description}</p>

      <div className="grid gap-3 sm:grid-cols-2">
        {group.settings.map((s) => (
          <Field key={s.key} s={s} value={values[s.key] ?? ''} onChange={(v) => set(s.key, v)} />
        ))}
      </div>

      {error && <p role="alert" className="mt-3 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}
      {msg && !error && <p role="status" className="mt-3 rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">{msg}</p>}

      <div className="mt-4 flex items-center gap-3">
        <button
          onClick={() => saveM.mutate()}
          disabled={saveM.isPending || dirty.size === 0}
          className="rounded-xl bg-navy px-5 py-2.5 text-sm font-bold text-white hover:bg-slate-800 disabled:opacity-50"
        >
          {saveM.isPending ? 'Saving…' : `Save ${group.title.split(' ')[0].toLowerCase()}`}
        </button>
        {group.id === 'email' && (
          <button
            onClick={() => testM.mutate()}
            disabled={testM.isPending}
            className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:border-gold hover:text-navy disabled:opacity-50"
          >
            <Icon name="envelope" aria-hidden="true" className="mr-1" />
            {testM.isPending ? 'Sending…' : 'Send test email'}
          </button>
        )}
        <p className="text-[11px] text-slate-400">Blank = fall back to the server .env value.</p>
      </div>
    </section>
  );
}

export default function AdminSettingsPage() {
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ['admin-settings'], queryFn: fetchAdminSettings });

  return (
    <div>
      <AdminPageHeader
        title="Settings"
        subtitle="Gateway credentials and business knobs — changes apply within 30 seconds, no redeploy"
      />
      <div className="mx-auto max-w-4xl space-y-5 p-6">
        {q.isLoading && <p role="status" className="text-sm text-slate-400">Loading…</p>}
        {q.isError && (
          <p role="alert" className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">
            Couldn&apos;t load settings: {(q.error as Error).message}
          </p>
        )}
        {(q.data ?? []).map((g) => (
          <GroupCard key={g.id} group={g} onSaved={() => qc.invalidateQueries({ queryKey: ['admin-settings'] })} />
        ))}
        <p className="text-[11px] text-slate-400">
          <Icon name="shield-halved" aria-hidden="true" className="mr-1 text-gold" />
          Secrets are write-only: they are never sent back to the browser after saving.
        </p>
      </div>
    </div>
  );
}
