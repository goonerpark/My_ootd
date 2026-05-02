import Link from 'next/link';
import { Cloud, Grid3X3, Home, PlusCircle, Sparkles, UserRound } from 'lucide-react';

const items = [
  { href: '/', label: 'Home', icon: Home, raised: false },
  { href: '/ootd-board', label: 'Board', icon: Grid3X3, raised: false },
  { href: '/ootd-upload', label: 'Upload', icon: PlusCircle, raised: true },
  { href: '/weather', label: 'Weather', icon: Cloud, raised: false },
  { href: '/mypage', label: 'Profile', icon: UserRound, raised: false }
] as const;

function isActive(activePath: string, href: string) {
  if (href === '/') return activePath === '/';
  return activePath === href || activePath.startsWith(`${href}/`);
}

export function BottomNav({ activePath }: { activePath: string }) {
  return (
    <nav className="fixed bottom-0 left-0 z-50 flex w-full items-center justify-around rounded-t-2xl border-t border-stone-100 bg-white/90 px-4 pb-6 pt-3 font-headline text-[10px] font-bold uppercase tracking-widest text-stone-400 shadow-[0_-10px_30px_rgba(0,0,0,0.04)] backdrop-blur-lg lg:hidden">
      {items.map((item) => {
        const Icon = item.icon;
        const active = isActive(activePath, item.href);
        return (
          <Link key={item.href} href={item.href} className={['flex flex-col items-center justify-center transition-transform', active ? 'scale-110 text-[#5A6D5E]' : '', item.raised ? '-translate-y-2' : ''].join(' ')}>
            {item.raised ? (
              <span className="mb-1 flex h-12 w-12 items-center justify-center rounded-full bg-primary-container text-white shadow-lg">
                <Icon size={23} />
              </span>
            ) : (
              <Icon size={20} className="mb-1" />
            )}
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
