'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import {
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from '@/lib/api/users';
import type { AppNotification } from '@/types/user';
import AdminPageHeader from '@/components/site/AdminPageHeader';
import Icon from '@/components/ui/Icon';

const TYPE_META: Record<string, { icon: string; chip: string; label: string }> = {
  LAWYER_SUBMITTED: { icon: 'id-card', chip: 'bg-amber-50 text-amber-700', label: 'New lawyer' },
  LAWYER_RESUBMITTED: { icon: 'clock-rotate-left', chip: 'bg-sky-50 text-sky-600', label: 'Resubmission' },
  CLIENT_QUERY: { icon: 'inbox', chip: 'bg-indigo-50 text-indigo-600', label: 'Client query' },
  REPORT_FILED: { icon: 'flag', chip: 'bg-rose-50 text-rose-600', label: 'Report' },
  SUBSCRIPTION_PURCHASED: { icon: 'tags', chip: 'bg-green-50 text-green-700', label: 'Payment' },
  PAYMENT_FAILED: { icon: 'credit-card', chip: 'bg-rose-50 text-rose-600', label: 'Failed payment' },
  PAYMENT_RECONCILED: { icon: 'credit-card', chip: 'bg-green-50 text-green-700', label: 'Reconciled' },
  LEAD_SLA_DIGEST: { icon: 'hourglass-half', chip: 'bg-amber-50 text-amber-700', label: 'Lead SLA' },
  DOCUMENT_PURCHASED: { icon: 'file-invoice', chip: 'bg-green-50 text-green-700', label: 'Doc sale' },
};

export default function AdminNotificationsPage() {
  const qc = useQueryClient();
  const router = useRouter();

  const q = useQuery({
    queryKey: ['admin-notifs'],
    queryFn: listNotifications,
    refetchInterval: 30_000,
  });
  const items = q.data ?? [];
  const unread = items.filter((n) => !n.readAt).length;
  const invalidate = () => qc.invalidateQueries({ queryKey: ['admin-notifs'] });

  const readM = useMutation({ mutationFn: markNotificationRead, onSuccess: invalidate });
  const allM = useMutation({ mutationFn: markAllNotificationsRead, onSuccess: invalidate });

  function open(n: AppNotification) {
    if (!n.readAt) readM.mutate(n.id);
    const link = (n.payloadJson?.link as string | undefined) ?? undefined;
    if (link) router.push(link);
  }

  return (
    <div>
      <AdminPageHeader
        title="Notifications"
        subtitle="Submissions, resubmissions, queries, reports, and payments as they happen"
        right={
          unread > 0 ? (
            <button
              onClick={() => allM.mutate()}
              disabled={allM.isPending}
              className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:border-gold hover:text-navy disabled:opacity-50"
            >
              Mark all read ({unread})
            </button>
          ) : undefined
        }
      />

      <div className="mx-auto max-w-3xl p-6">
        {q.isLoading && <p role="status" className="text-sm text-slate-400">Loading…</p>}
        {q.isError && (
          <p role="alert" className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">
            Couldn&apos;t load notifications: {(q.error as Error).message}
          </p>
        )}
        {!q.isLoading && items.length === 0 && (
          <div className="rounded-2xl border border-dashed border-gray-200 p-10 text-center text-sm text-slate-400">
            <Icon name="bell" aria-hidden="true" className="mb-2 text-2xl text-slate-300" />
            <p>Nothing yet — new submissions, queries, and payments will land here.</p>
          </div>
        )}

        <ul className="space-y-2">
          {items.map((n) => {
            const meta = TYPE_META[n.type] ?? { icon: 'bell', chip: 'bg-slate-100 text-slate-500', label: n.type.split('_')[0] };
            const p = n.payloadJson ?? {};
            const title = (p.title as string) ?? n.type.replace(/_/g, ' ');
            const body = p.body as string | undefined;
            const hasLink = !!p.link;
            return (
              <li key={n.id}>
                <button
                  onClick={() => open(n)}
                  className={`flex w-full items-start gap-3 rounded-2xl border p-4 text-left shadow-sm transition ${
                    n.readAt ? 'border-gray-200/60 bg-white' : 'border-gold/40 bg-amber-50/40'
                  } hover:border-gold`}
                >
                  <span aria-hidden="true" className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${meta.chip}`}>
                    <Icon name={meta.icon} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-center gap-2">
                      <span className={`text-sm ${n.readAt ? 'font-semibold text-slate-700' : 'font-bold text-navy'}`}>{title}</span>
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${meta.chip}`}>{meta.label}</span>
                      {!n.readAt && <span aria-label="Unread" className="h-2 w-2 rounded-full bg-gold" />}
                    </span>
                    {body && <span className="mt-0.5 block text-xs text-slate-500">{body}</span>}
                    <span className="mt-1 block text-[11px] text-slate-400">
                      {new Date(n.createdAt).toLocaleString()}
                      {hasLink && <span className="ml-2 font-semibold text-gold">Open <Icon name="chevron-right" aria-hidden="true" className="text-[9px]" /></span>}
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
