import Link from 'next/link';
import Image from 'next/image';
import Icon from '@/components/ui/Icon';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Left brand panel */}
      <aside className="hero-gradient relative hidden flex-col justify-between overflow-hidden p-12 text-white lg:flex lg:w-1/2">
        <div aria-hidden="true" className="absolute -bottom-20 -right-20 h-96 w-96 rounded-full bg-gold/10 blur-3xl" />
        <Icon name="scale-balanced" aria-hidden="true" className="absolute right-10 top-1/3 text-[18rem] text-gold/10" />

        <Link href="/" className="relative z-10 flex items-center" aria-label="LawMitran home">
          <Image src="/logo-light.svg" alt="LawMitran" width={150} height={36} className="h-9 w-auto" priority />
        </Link>

        <div className="relative z-10">
          <p className="text-4xl font-extrabold leading-tight">
            Welcome to
            <br />
            <span className="text-gold">Legal Help, Simplified.</span>
          </p>
          <p className="mt-4 max-w-md text-slate-300">
            Manage your requirements, saved lawyers, and legal documents — all in one place.
          </p>
          <ul className="mt-8 space-y-3 text-sm text-slate-200">
            <li className="flex items-center gap-3">
              <Icon name="circle-check" className="text-gold" /> Bar Council–verified lawyers
            </li>
            <li className="flex items-center gap-3">
              <Icon name="circle-check" className="text-gold" /> 1000+ ready legal documents
            </li>
            <li className="flex items-center gap-3">
              <Icon name="circle-check" className="text-gold" /> Secure &amp; confidential
            </li>
          </ul>
        </div>

        <div className="relative z-10">
          <p className="text-xs text-slate-400">© 2026 LawMitran · Justice Made Accessible.</p>
          <p className="mt-1.5 max-w-sm text-[11px] text-slate-500">
            An information platform, not a law firm. We don&apos;t provide legal advice.
          </p>
        </div>
      </aside>

      {/* Right form panel */}
      <main id="main" className="flex flex-1 flex-col">
        <div className="p-6">
          <Link href="/" className="text-sm font-medium text-slate-500 hover:text-navy">
            <Icon name="arrow-left" className="mr-1" /> Back to home
          </Link>
        </div>
        <div className="flex flex-1 items-center justify-center px-6 pb-12">
          <div className="w-full max-w-md">
            <Link href="/" className="mb-8 flex items-center justify-center lg:hidden" aria-label="LawMitran home">
              <Image src="/logo.svg" alt="LawMitran" width={150} height={36} className="h-9 w-auto" />
            </Link>
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
