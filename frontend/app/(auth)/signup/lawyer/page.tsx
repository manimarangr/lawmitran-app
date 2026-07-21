import type { Metadata } from 'next';
import Icon from '@/components/ui/Icon';
import AuthShell from '@/components/auth/AuthShell';
import SignupAside, { type SignupBenefit } from '@/components/auth/SignupAside';
import SignupForm from '@/components/auth/SignupForm';
import { fetchPlanTiersServer } from '@/lib/api/subscriptions';
import type { TierOffer } from '@/types/subscription';

export const metadata: Metadata = {
  title: 'Sign Up as a Lawyer | LawMitran',
  description: 'Join LawMitran as a Bar Council–verified advocate — receive client leads, build your profile, and grow your practice.',
};

const BENEFITS: SignupBenefit[] = [
  { icon: 'inbox', text: 'Receive verified client leads' },
  { icon: 'id-badge', text: 'Professional profile' },
  { icon: 'magnifying-glass', text: 'Practice area visibility' },
  { icon: 'location-dot', text: 'City listing' },
  { icon: 'gauge-high', text: 'Lead dashboard' },
  { icon: 'clock-rotate-left', text: 'Case reminder system' },
  { icon: 'shield-halved', text: 'Verification badge' },
  { icon: 'crown', text: 'Subscription plans' },
];

const PLANS: { name: string; blurb: string; feats: string[]; featured?: boolean }[] = [
  {
    name: 'Starter',
    blurb: 'Get listed & get discovered',
    feats: ['Verified public profile', 'Limited monthly leads', 'Standard lead routing'],
  },
  {
    name: 'Professional',
    blurb: 'Grow your practice faster',
    featured: true,
    feats: ['Everything in Starter', 'More client leads/month', 'Priority lead routing', 'Professional badge'],
  },
  {
    name: 'Premium',
    blurb: 'Maximum visibility & volume',
    feats: ['Everything in Professional', 'Unlimited client leads', 'Top search ranking', 'Premium badge & homepage'],
  },
];

function OfferBanner({ offer }: { offer: TierOffer }) {
  const discount =
    offer.discountType === 'PERCENT'
      ? `${offer.discountValue}% OFF`
      : `₹${Math.round(offer.discountValue).toLocaleString('en-IN')} OFF`;
  const endsAt = new Date(offer.endsAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });

  return (
    <div className="hero-gradient relative mb-5 overflow-hidden rounded-2xl px-6 py-7 text-center text-white shadow-lg">
      <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-gold">
        <Icon name="tags" aria-hidden="true" className="mr-1.5" />
        Limited-time offer
      </p>
      <p className="mt-2 text-4xl font-extrabold tracking-tight">{discount}</p>
      <p className="mt-1.5 text-sm font-bold text-white/90">{offer.name}</p>
      <p className="mx-auto mt-3 max-w-xs text-xs leading-relaxed text-slate-300">
        {offer.description ?? 'On your first subscription plan.'} Ends {endsAt} — sign up now to lock it in.
      </p>
    </div>
  );
}

function PlanCards({ offer }: { offer: TierOffer | null }) {
  return (
    <div className="mt-8">
      {offer && <OfferBanner offer={offer} />}

      <p className="mb-3 text-xs font-bold uppercase tracking-wide text-slate-500">Plans built to grow with you</p>
      <div className="grid gap-4 sm:grid-cols-3">
        {PLANS.map((p) => (
          <div
            key={p.name}
            className={`relative flex flex-col rounded-2xl bg-white p-5 shadow-sm ${
              p.featured ? 'border-2 border-gold shadow-md' : 'border border-line'
            }`}
          >
            {p.featured && (
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-gold px-3 py-1 text-[10px] font-bold text-navy shadow">
                Most Popular
              </span>
            )}
            <h3 className="text-sm font-bold text-navy">{p.name}</h3>
            <p className="mt-1 text-[11px] text-slate-500">{p.blurb}</p>
            <ul className="mt-3 flex-1 space-y-1.5 text-[11px] text-slate-600">
              {p.feats.map((f) => (
                <li key={f} className="flex gap-1.5">
                  <span className="text-gold">
                    <Icon name="check" />
                  </span>
                  {f}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <p className="mt-3 text-[11px] text-slate-400">
        Pick your plan and see live pricing from your dashboard after your Bar Council verification is approved.
      </p>
    </div>
  );
}

export default async function LawyerSignupPage() {
  const tiers = await fetchPlanTiersServer();
  const offer = tiers.find((t) => t.offer)?.offer ?? null;

  return (
    <AuthShell
      aside={
        <SignupAside
          title="Grow Your Legal Practice"
          subtitle="Join India's growing legal marketplace."
          benefits={BENEFITS}
        >
          <PlanCards offer={offer} />
        </SignupAside>
      }
    >
      <SignupForm
        role="LAWYER"
        heading="Create your lawyer account"
        subheading="Get discovered by clients looking for legal help."
        submitLabel="Create Lawyer Account"
      />
    </AuthShell>
  );
}
