import Link from 'next/link';
import Image from 'next/image';
import Icon from '@/components/ui/Icon';

/**
 * Centered auth layout (light theme): logo on top, white card in the middle,
 * trust signals + disclaimer below. Replaces the former navy split-panel.
 */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="hero-light flex min-h-screen flex-col">
      <div className="p-6">
        <Link href="/" className="text-sm font-medium text-slate-500 hover:text-navy">
          <Icon name="arrow-left" className="mr-1" /> Back to home
        </Link>
      </div>

      <main id="main" className="flex flex-1 flex-col items-center justify-center px-6 pb-10">
        <Link href="/" className="mb-6 flex items-center" aria-label="LawMitran home">
          <Image src="/logo.svg" alt="LawMitran" width={170} height={40} className="h-10 w-auto" priority />
        </Link>

        <div className="w-full max-w-md rounded-2xl border border-line bg-white p-8 shadow-[0_18px_50px_rgba(11,25,44,.10)]">
          {children}
        </div>

        <ul className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs font-semibold text-slate-500">
          <li><Icon name="circle-check" aria-hidden="true" className="mr-1 text-gold" />Bar Council–verified lawyers</li>
          <li><Icon name="circle-check" aria-hidden="true" className="mr-1 text-gold" />Secure &amp; confidential</li>
          <li><Icon name="circle-check" aria-hidden="true" className="mr-1 text-gold" />All India coverage</li>
        </ul>
        <p className="mt-3 max-w-md text-center text-[11px] text-slate-400">
          © 2026 LawMitran · An information platform, not a law firm. We don&apos;t provide legal advice.
        </p>
      </main>
    </div>
  );
}
