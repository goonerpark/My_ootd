import Link from 'next/link';
import { Cloud, Grid3X3, Home, PlusCircle, Sparkles, UserRound } from 'lucide-react';

const navItems = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/ootd-board', label: 'OOTD Board', icon: Grid3X3 },
  { href: '/outfit-inspirations', label: 'Inspiration', icon: Sparkles },
  { href: '/weather', label: 'Weather', icon: Cloud },
  { href: '/ootd-upload', label: 'Upload', icon: PlusCircle },
  { href: '/mypage', label: 'Profile', icon: UserRound }
] as const;

function isActive(activePath: string, href: string) {
  if (href === '/') return activePath === '/';
  return activePath === href || activePath.startsWith(`${href}/`);
}

export function Sidebar({ activePath }: { activePath: string }) {
  return (
    <aside className="fixed left-0 top-0 z-50 hidden h-screen w-64 flex-col gap-2 border-r border-stone-100 bg-white p-6 font-headline text-sm tracking-wide text-[#5A6D5E] lg:flex">
      <div className="mb-8">
        <Link href="/" className="text-xl font-black text-[#5A6D5E]">
          my_ootd
        </Link>
        <p className="mt-1 text-xs font-light text-stone-400">Your Daily Style Guide</p>
      </div>
      <nav className="flex flex-col gap-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(activePath, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={[
                'flex items-center gap-3 rounded-lg px-4 py-3 transition-transform duration-200 hover:translate-x-1',
                active ? 'bg-stone-50 font-semibold text-[#5A6D5E]' : 'text-stone-500 hover:bg-stone-50'
              ].join(' ')}
            >
              <Icon size={19} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
      <div className="mt-auto pt-6">
        <Link href="/ootd-upload" className="block w-full rounded-full bg-primary-container py-3 text-center font-bold text-on-primary-container shadow-sm active:scale-95">
          Post OOTD
        </Link>
      </div>
    </aside>
  );
}