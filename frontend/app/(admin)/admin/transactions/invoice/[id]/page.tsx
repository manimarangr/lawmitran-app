'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { fetchInvoice } from '@/lib/api/admin';
import Icon from '@/components/ui/Icon';

const inr = (v: number) => `₹${v.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;

export default function InvoicePage() {
  const { id } = useParams<{ id: string }>();
  const q = useQuery({ queryKey: ['invoice', id], queryFn: () => fetchInvoice(id), enabled: !!id });
  const inv = q.data;

  return (
    <div className="mx-auto max-w-3xl p-6">
      {/* toolbar — hidden when printing */}
      <div className="mb-5 flex items-center justify-between print:hidden">
        <Link href="/admin/transactions" className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:border-gold hover:text-navy">
          <Icon name="chevron-left" aria-hidden="true" className="mr-1 text-xs" /> Back to transactions
        </Link>
        {inv && (
          <button onClick={() => window.print()} className="rounded-xl bg-navy px-5 py-2 text-sm font-bold text-white hover:bg-slate-800">
            <Icon name="download" aria-hidden="true" className="mr-1" /> Print / Save PDF
          </button>
        )}
      </div>

      {q.isLoading && <p role="status" className="text-sm text-slate-400">Loading…</p>}
      {q.isError && (
        <p role="alert" className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {(q.error as Error).message}
        </p>
      )}

      {inv && (
        <div className="rounded-2xl border border-gray-200 bg-white p-8 print:border-0 print:p-0">
          <div className="flex items-start justify-between border-b border-gray-200 pb-5">
            <div>
              <h1 className="text-xl font-extrabold text-navy">TAX INVOICE</h1>
              <p className="mt-1 text-xs text-slate-500">Invoice No: <b className="text-slate-700">{inv.invoiceNo}</b></p>
              <p className="text-xs text-slate-500">Date: {new Date(inv.date).toLocaleDateString('en-IN')}</p>
            </div>
            <div className="text-right text-xs text-slate-500">
              <p className="text-sm font-bold text-navy">{inv.seller.name}</p>
              {inv.seller.address && <p className="max-w-[240px]">{inv.seller.address}</p>}
              {inv.seller.gstin ? (
                <p className="mt-1">GSTIN: <b className="text-slate-700">{inv.seller.gstin}</b></p>
              ) : (
                <p className="mt-1 text-amber-600 print:hidden">Set your GSTIN in Settings → Billing</p>
              )}
            </div>
          </div>

          <div className="mt-5 text-xs text-slate-500">
            <p className="mb-1 font-bold uppercase tracking-wide text-slate-400">Billed to</p>
            <p className="text-sm font-semibold text-slate-800">{inv.buyer.name}</p>
            {inv.buyer.address && <p>{inv.buyer.address}</p>}
            <p>{inv.buyer.email} · {inv.buyer.mobile}</p>
            <p>State: {inv.buyer.state}</p>
          </div>

          <table className="mt-6 w-full text-sm">
            <thead className="border-b-2 border-gray-200 text-[11px] uppercase tracking-wide text-slate-500">
              <tr>
                <th className="py-2 text-left font-bold">Description</th>
                <th className="py-2 text-right font-bold">Taxable value</th>
                <th className="py-2 text-right font-bold">GST ({inv.gstRate}%)</th>
                <th className="py-2 text-right font-bold">Total</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-gray-100">
                <td className="py-3 text-slate-700">
                  {inv.item.description}
                  {inv.item.offerName && inv.item.listAmount && (
                    <span className="block text-[11px] text-slate-400">
                      Offer applied: {inv.item.offerName} (list price {inr(inv.item.listAmount)})
                    </span>
                  )}
                </td>
                <td className="py-3 text-right text-slate-700">{inr(inv.taxableValue)}</td>
                <td className="py-3 text-right text-slate-700">{inr(inv.gstAmount)}</td>
                <td className="py-3 text-right font-semibold text-slate-800">{inr(inv.total)}</td>
              </tr>
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={3} className="py-3 text-right text-sm font-bold text-navy">Grand total</td>
                <td className="py-3 text-right text-base font-extrabold text-navy">{inr(inv.total)}</td>
              </tr>
            </tfoot>
          </table>

          <p className="mt-6 border-t border-gray-100 pt-4 text-[11px] text-slate-400">
            Payment reference: {inv.provider} · order {inv.providerOrderId}
            {inv.providerPaymentId && ` · payment ${inv.providerPaymentId}`}. Amount is inclusive of GST.
            This is a computer-generated invoice.
          </p>
        </div>
      )}
    </div>
  );
}
