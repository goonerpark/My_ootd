import Link from 'next/link';
import { AppLogo } from '@/components/ui';

export function Footer() {
  return (
    <footer className="border-t border-stone-100 bg-[#FCFAFA] px-6 py-12 font-headline text-xs font-light text-stone-400 lg:ml-64">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-8 md:flex-row">
        <div className="text-center md:text-left">
          <AppLogo size="sm" className="mb-2" />
          <p>© 2026 my_ootd. Minimal Fashion Archive.</p>
        </div>
        <div className="flex flex-wrap justify-center gap-6">
          {['About', 'Terms', 'Privacy', 'Contact', 'Instagram'].map((label) => (
            <Link key={label} href="#" className="underline-offset-4 transition hover:text-stone-600 hover:underline">
              {label}
            </Link>
          ))}
        </div>
      </div>
    </footer>
  );
}
