import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import SiteFooter from '@/components/site/SiteFooter';
import Icon from '@/components/ui/Icon';
import DocumentWizard from '@/components/documents/DocumentWizard';
import { fetchDocTemplate } from '@/lib/api/documents';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.lawmitran.com';

export const revalidate = 300;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const t = await fetchDocTemplate(slug);
  if (!t) return { title: 'Document not found' };
  return {
    title: `${t.title} — Online Template | LawMitran`,
    description: `Create a ${t.title} online in minutes: guided form, instant preview, download after payment. ₹${Number(t.price).toLocaleString('en-IN')}.`,
    alternates: { canonical: `${SITE_URL}/legal-documents/${t.slug}` },
  };
}

export default async function DocumentTemplatePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const t = await fetchDocTemplate(slug);
  if (!t) notFound();

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: t.title,
    description: `Ready-to-use ${t.title} template with a guided form.`,
    offers: { '@type': 'Offer', price: Number(t.price), priceCurrency: 'INR' },
  };

  return (
    <main id="main">
      <header className="hero-gradient py-10 text-white">
        <div className="mx-auto max-w-4xl px-6">
          <nav aria-label="Breadcrumb" className="mb-3 text-xs text-slate-300">
            <Link href="/" className="hover:text-gold">Home</Link> <span className="mx-1">/</span>
            <Link href="/legal-documents" className="hover:text-gold">Legal Documents</Link> <span className="mx-1">/</span>
            {t.title}
          </nav>
          <h1 className="text-2xl font-extrabold tracking-tight md:text-3xl">{t.title}</h1>
          <p className="mt-2 text-sm text-slate-300">
            {t.category.name} · ₹{Number(t.price).toLocaleString('en-IN')} · Fill the guided form,
            preview free, pay to download.
          </p>
          {t.requiresStamp && (
            <p className="mt-3 inline-flex items-center gap-2 rounded-xl bg-white/10 px-3 py-2 text-xs text-amber-200">
              <Icon name="file-shield" aria-hidden="true" />
              Stamp paper required{t.stampBasis ? ` — ${t.stampBasis.toLowerCase()}` : ''}. You&apos;ll
              receive the draft; e-stamping is done separately per your state&apos;s rules.
            </p>
          )}
        </div>
      </header>

      <div className="mx-auto max-w-4xl px-6 py-10">
        <DocumentWizard template={t} />
        <p className="mt-8 text-[11px] leading-relaxed text-slate-400">
          This is a self-help template for common situations — it is not legal advice and LawMitran
          is not a law firm. For anything unusual,{' '}
          <Link href="/lawyers" className="font-semibold text-gold hover:underline">talk to a verified lawyer</Link>.
        </p>
      </div>
      <SiteFooter />
    </main>
  );
}
