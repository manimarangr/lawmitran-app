import Link from 'next/link';
import SiteHeader from '@/components/site/SiteHeader';
import SiteFooter from '@/components/site/SiteFooter';
import Icon from '@/components/ui/Icon';
import AskLegalBox from '@/components/home/AskLegalBox';
import { getLawyers, getPracticeAreas, type PracticeAreaRef } from '@/lib/api/seo';
import type { LawyerListItem } from '@/types/lawyer';

// ISR — refresh featured lawyers/areas periodically.
export const revalidate = 1800;

/** Fallback reference data when the API is unreachable (e.g. cold local dev). */
const FALLBACK_AREAS: PracticeAreaRef[] = [
  { id: 'family-law', name: 'Family Law', slug: 'family-law' },
  { id: 'criminal-law', name: 'Criminal Law', slug: 'criminal-law' },
  { id: 'property-law', name: 'Property Law', slug: 'property-law' },
  { id: 'civil-law', name: 'Civil Law', slug: 'civil-law' },
  { id: 'corporate-law', name: 'Corporate Law', slug: 'corporate-law' },
  { id: 'consumer-law', name: 'Consumer Law', slug: 'consumer-law' },
  { id: 'employment-law', name: 'Employment Law', slug: 'employment-law' },
  { id: 'tax-law', name: 'Tax Law', slug: 'tax-law' },
];

const AREA_ICONS: Record<string, string> = {
  'family-law': 'users',
  'criminal-law': 'shield-halved',
  'property-law': 'file-shield',
  'civil-law': 'scale-balanced',
  'corporate-law': 'briefcase',
  'consumer-law': 'gavel',
  'employment-law': 'id-badge',
  'tax-law': 'file-invoice',
  'intellectual-property': 'bookmark',
  immigration: 'paper-plane',
  'banking-finance': 'tags',
  'cyber-law': 'bolt',
};

const AREA_DESCRIPTIONS: Record<string, string> = {
  'family-law': 'Divorce, maintenance, custody, and matrimonial disputes.',
  'criminal-law': 'Bail, FIR processing, trial strategy, and courtroom defence.',
  'property-law': 'Deeds, partitions, succession, and property disputes.',
  'civil-law': 'Civil suits, recovery, injunctions, and disputes.',
  'corporate-law': 'Contracts, compliance, governance, and transactions.',
  'consumer-law': 'Consumer complaints, product disputes, and compensation.',
  'employment-law': 'Employment terms, disputes, and workplace matters.',
  'tax-law': 'Income tax, GST, and tax dispute representation.',
};

const DOCS = [
  { icon: 'file-shield', title: 'Affidavits' },
  { icon: 'file-invoice', title: 'Rental Agreement' },
  { icon: 'id-badge', title: 'Name Change' },
  { icon: 'folder-open', title: 'Contracts & Agreements' },
];

const STEPS = [
  { title: 'Tell us your issue', desc: "Choose a category and your city, or describe your situation in a few words. It's free and confidential." },
  { title: 'Get matched', desc: 'We route your requirement to verified, eligible lawyers who handle your type of case in your area.' },
  { title: 'The lawyer contacts you', desc: 'Matched lawyers reach out directly. You compare, choose, and proceed — no obligation.' },
];

export default async function HomePage() {
  // Real data from the API; graceful fallbacks keep the page rendering if it's down.
  const [featuredResult, areasResult] = await Promise.allSettled([
    getLawyers({ sort: 'rating', limit: 3 }),
    getPracticeAreas(),
  ]);
  const featured: LawyerListItem[] =
    featuredResult.status === 'fulfilled' ? featuredResult.value.items : [];
  const areas: PracticeAreaRef[] =
    areasResult.status === 'fulfilled' && areasResult.value.length > 0
      ? areasResult.value
      : FALLBACK_AREAS;
  const gridAreas = areas.filter((a) => AREA_DESCRIPTIONS[a.slug]).slice(0, 4).length >= 4
    ? areas.filter((a) => AREA_DESCRIPTIONS[a.slug]).slice(0, 4)
    : areas.slice(0, 4);

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />

      <main id="main" className="flex-1">
        {/* ===== Hero (dark) ===== */}
        <section
          id="find"
          className="relative overflow-hidden px-5 pb-[84px] pt-[78px] text-center"
          style={{
            background:
              'radial-gradient(900px 420px at 82% 0%, rgba(201,162,75,.20), transparent 60%), linear-gradient(160deg,#0c1c3e 0%, #0a1838 55%, #081330 100%)',
          }}
        >
          <Icon
            name="scale-balanced"
            aria-hidden="true"
            className="pointer-events-none absolute right-[4%] top-1/2 hidden -translate-y-1/2 text-[22rem] text-white/10 lg:block"
          />
          <div className="relative z-10 mx-auto max-w-[860px]">
            <span className="inline-block rounded-full border border-gold/55 px-4.5 py-1.5 text-xs font-bold uppercase tracking-[.16em] text-gold">
              Verified Legal Marketplace
            </span>
            <h1 className="mt-5 text-4xl font-extrabold leading-[1.06] tracking-[-1.5px] text-white sm:text-5xl lg:text-[56px]">
              What&apos;s your <span className="text-gold">legal question?</span>
            </h1>
            <p className="mx-auto mt-4 max-w-[620px] text-lg text-[#aab6d4]">
              Describe your issue in plain words — get instant guidance on what the law says and
              what to do next, then connect with a verified lawyer.
            </p>
            <ul className="mb-8 mt-4 flex flex-wrap justify-center gap-5 text-[13.5px] font-semibold text-[#c7d0e4]">
              {['Bar Council verified', 'Fast & confidential', 'All India, all practice areas'].map((t) => (
                <li key={t} className="flex items-center gap-2">
                  <span aria-hidden="true" className="h-[7px] w-[7px] rounded-full bg-gold" /> {t}
                </li>
              ))}
            </ul>

            {/* hero: legal-question box (docs/12 P0) — search demoted to the link below */}
            <AskLegalBox />
            <p className="mt-4 text-[13px] text-[#8ea0c4]">
              Know what you need?{' '}
              <Link href="/lawyers" className="text-gold underline">
                Search lawyers by city &amp; practice area
              </Link>
            </p>
          </div>
        </section>

        {/* ===== Trust strip ===== */}
        <section aria-label="Why LawMitran" className="border-b border-line bg-bg-soft px-5">
          <div className="mx-auto grid max-w-[1180px] gap-6 py-9 md:grid-cols-3">
            {[
              { icon: 'circle-check', title: 'Trusted', desc: 'Every lawyer is Bar Council verified before they appear in search.' },
              { icon: 'bolt', title: 'Convenient', desc: 'Submit once, get matched in minutes. Lawyers contact you directly.' },
              { icon: 'users', title: 'For everyone', desc: 'Help across practice areas, languages, and cities — all over India.' },
            ].map((t) => (
              <div key={t.title} className="flex items-start gap-4">
                <span aria-hidden="true" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-navy text-lg text-gold">
                  <Icon name={t.icon} />
                </span>
                <div>
                  <b className="text-navy">{t.title}</b>
                  <p className="mt-1 text-sm text-muted">{t.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ===== Practice areas (from reference API) ===== */}
        <section id="practice" className="px-5 py-16">
          <div className="mx-auto max-w-[1180px]">
            <div className="mb-9 flex flex-wrap items-end justify-between gap-4">
              <div>
                <span className="text-[12.5px] font-bold uppercase tracking-[.14em] text-gold">Practice Areas</span>
                <h2 className="mt-1 text-3xl font-bold tracking-tight text-navy">Find the right legal expertise</h2>
              </div>
              <Link href="/lawyers" className="text-sm font-bold text-navy hover:text-gold">
                View all <Icon name="arrow-right" aria-hidden="true" />
              </Link>
            </div>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {gridAreas.map((a) => (
                <Link
                  key={a.id}
                  href={`/lawyers/practice/${a.slug}`}
                  className="group rounded-2xl border border-line bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:border-gold hover:shadow-lg"
                >
                  <span aria-hidden="true" className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-bg-soft text-xl text-navy transition group-hover:bg-navy group-hover:text-gold">
                    <Icon name={AREA_ICONS[a.slug] ?? 'gavel'} />
                  </span>
                  <b className="text-navy">{a.name}</b>
                  <p className="mt-1.5 text-sm leading-6 text-muted">
                    {AREA_DESCRIPTIONS[a.slug] ?? `Verified ${a.name.toLowerCase()} advocates across India.`}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* ===== Featured lawyers (top-rated, from API) ===== */}
        <section className="bg-bg-soft px-5 py-16">
          <div className="mx-auto max-w-[1180px]">
            <div className="mb-9 flex flex-wrap items-end justify-between gap-4">
              <div>
                <span className="text-[12.5px] font-bold uppercase tracking-[.14em] text-gold">Verified Pros</span>
                <h2 className="mt-1 text-3xl font-bold tracking-tight text-navy">Our featured lawyers</h2>
              </div>
              <Link href="/lawyers" className="text-sm font-bold text-navy hover:text-gold">
                View all <Icon name="arrow-right" aria-hidden="true" />
              </Link>
            </div>

            {featured.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-gray-200 bg-white p-10 text-center text-sm text-slate-400">
                Verified lawyers are joining LawMitran now —{' '}
                <Link href="/lawyers" className="font-semibold text-gold hover:underline">browse the directory</Link>{' '}
                or{' '}
                <Link href="/signup?role=lawyer" className="font-semibold text-gold hover:underline">join as a lawyer</Link>.
              </p>
            ) : (
              <div className="grid gap-6 md:grid-cols-3">
                {featured.map((l) => {
                  const tags = l.practiceAreas.slice(0, 2).map((p) => p.practiceArea.name);
                  const initials = l.fullName.split(' ').map((w) => w[0]).slice(0, 2).join('');
                  const rating = l.ratingAvg ? parseFloat(l.ratingAvg) : 0;
                  return (
                    <article key={l.id} className="flex flex-col justify-between rounded-2xl border border-line bg-white p-6 shadow-sm">
                      <div>
                        <div className="flex items-start gap-4">
                          <span className="relative">
                            <span
                              aria-hidden="true"
                              className="hero-gradient flex h-14 w-14 items-center justify-center rounded-full border-2 border-gold-soft text-lg font-bold text-gold"
                            >
                              {initials}
                            </span>
                            <span aria-hidden="true" className="absolute bottom-0.5 right-0.5 h-3 w-3 rounded-full border-2 border-white bg-green-500" />
                          </span>
                          <div>
                            <h3 className="font-bold text-navy">
                              {l.slug ? (
                                <Link href={`/lawyer/${l.slug}`} className="hover:text-navy-2">{l.fullName}</Link>
                              ) : (
                                l.fullName
                              )}
                            </h3>
                            {l.city && (
                              <p className="text-sm text-muted">
                                <Icon name="location-dot" aria-hidden="true" className="mr-1 text-gold" />
                                {l.city.name}
                              </p>
                            )}
                            {rating > 0 && (
                              <p className="text-sm text-gold">
                                <Icon name="star-fill" aria-hidden="true" /> {rating.toFixed(1)}{' '}
                                <span className="text-muted">({l.ratingCount} reviews)</span>
                              </p>
                            )}
                          </div>
                        </div>
                        {tags.length > 0 && (
                          <div className="mt-4 flex flex-wrap gap-2">
                            {tags.map((t) => (
                              <span key={t} className="rounded-full bg-bg-soft px-3 py-1 text-xs font-semibold text-navy">
                                {t}
                              </span>
                            ))}
                          </div>
                        )}
                        {l.bio && <p className="mt-3 line-clamp-3 text-sm leading-6 text-muted">{l.bio}</p>}
                      </div>
                      <div className="mt-5 flex items-center justify-between border-t border-line pt-4">
                        <div className="text-sm">
                          <span className="block text-xs text-muted">Experience</span>
                          <span className="font-bold text-navy">{l.experienceYears} yrs</span>
                        </div>
                        <Link
                          href={l.slug ? `/lawyer/${l.slug}` : '/lawyers'}
                          className="rounded-[10px] bg-navy px-4 py-2 text-[13.5px] font-semibold text-white transition hover:bg-navy-2"
                        >
                          Contact
                        </Link>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        {/* ===== Documents ===== */}
        <section id="documents" className="px-5 py-16">
          <div className="mx-auto max-w-[1180px] text-center">
            <span className="block text-[12.5px] font-bold uppercase tracking-[.14em] text-gold">
              Do-it-yourself legal documents
            </span>
            <h2 className="mt-2 text-3xl font-bold tracking-tight text-navy">Get legal documents, delivered online</h2>
            <p className="mx-auto mt-2 max-w-[620px] text-muted">
              Pick a document, fill a guided form, add stamp paper if needed, and download — or get the stamped copy couriered.
            </p>
            <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {DOCS.map((d) => (
                <Link key={d.title} href="/legal-documents" className="block rounded-2xl border border-line bg-white p-6 shadow-sm transition hover:border-gold hover:shadow-md">
                  <span aria-hidden="true" className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-bg-soft text-xl text-navy">
                    <Icon name={d.icon} />
                  </span>
                  <b className="block text-navy">{d.title}</b>
                  <small className="text-muted">&amp; more →</small>
                </Link>
              ))}
            </div>
            <div className="mt-8">
              <Link
                href="/legal-documents"
                className="inline-flex rounded-[10px] bg-gold px-6 py-3 text-[15px] font-semibold text-navy transition hover:-translate-y-px hover:bg-[#b8902f]"
              >
                Browse all documents
              </Link>
            </div>
          </div>
        </section>

        {/* ===== How it works ===== */}
        <section id="how" className="bg-bg-soft px-5 py-16">
          <div className="mx-auto max-w-[1180px]">
            <h2 className="text-center text-3xl font-bold tracking-tight text-navy">How LawMitran works</h2>
            <p className="mx-auto mt-2 max-w-[620px] text-center text-muted">
              Three simple steps from problem to the right lawyer.
            </p>
            <ol className="mt-10 grid gap-6 md:grid-cols-3">
              {STEPS.map((s, i) => (
                <li key={s.title} className="rounded-2xl border border-line bg-white p-7 text-center shadow-sm">
                  <span aria-hidden="true" className="mx-auto mb-4 flex h-11 w-11 items-center justify-center rounded-full bg-navy text-lg font-extrabold text-gold">
                    {i + 1}
                  </span>
                  <b className="text-navy">{s.title}</b>
                  <p className="mt-2 text-sm leading-6 text-muted">{s.desc}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
