'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Bell, Camera, ClipboardList, LayoutDashboard, Shirt, UserRound } from 'lucide-react';
import { clearAccessTokenFromStorage, getAccessTokenFromStorage, getAuthUserProfileFromStorage } from '@/lib/auth/token';
import { fetchMyProfile } from '@/lib/api/client';
import { AppLogo } from '@/components/ui';

const navItems = [
  { href: '/', label: 'Home', icon: LayoutDashboard },
  { href: '/closet', label: 'Closet', icon: Shirt },
  { href: '/survey', label: 'Survey', icon: ClipboardList },
  { href: '/ootd', label: 'OOTD', icon: Camera },
  { href: '/mypage', label: 'Profile', icon: UserRound }
] as const;

type StoredProfile = ReturnType<typeof getAuthUserProfileFromStorage>;

function isActivePath(activePath: string, href: string) {
  if (href === '/') return activePath === '/';
  return activePath === href || activePath.startsWith(`${href}/`);
}

function useClientAuthProfile() {
  const [hasToken, setHasToken] = useState(false);
  const [profile, setProfile] = useState<StoredProfile>(null);

  useEffect(() => {
    const token = getAccessTokenFromStorage();
    setHasToken(Boolean(token));
    setProfile(getAuthUserProfileFromStorage());

    if (!token) return;

    fetchMyProfile(token).catch(() => {
      clearAccessTokenFromStorage();
      setHasToken(false);
      setProfile(null);
    });
  }, []);

  const logout = () => {
    clearAccessTokenFromStorage();
    setHasToken(false);
    setProfile(null);
    window.location.href = '/';
  };

  return { hasToken, profile, logout };
}

export function TopNav({ activePath }: { activePath: string }) {
  const { hasToken, profile, logout } = useClientAuthProfile();

  return (
    <header className="fixed left-0 right-0 top-0 z-50 border-b border-slate-100 bg-white/80 px-6 py-4 shadow-sm backdrop-blur-md md:pl-[304px]">
      <div className="mx-auto flex w-full max-w-full items-center justify-between gap-4">
        <AppLogo size="sm" />

        <nav className="hidden items-center gap-8 text-sm font-medium md:flex">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={
                isActivePath(activePath, item.href)
                  ? 'border-b-2 border-slate-900 pb-1 text-slate-900'
                  : 'text-slate-400 transition-colors hover:text-slate-700'
              }
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex shrink-0 items-center gap-2">
          <button className="rounded-full p-2 text-slate-800 transition-colors hover:bg-slate-50" type="button" aria-label="알림">
            <Bell size={20} />
          </button>
          {hasToken ? (
            <>
              <Link
                className="hidden rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 shadow-sm transition hover:bg-slate-50 sm:inline-flex"
                href="/mypage"
              >
                {profile?.nickname ? `${profile.nickname} 님` : '마이페이지'}
              </Link>
              <button
                className="rounded-full bg-primary px-4 py-2 text-sm font-bold text-white shadow-sm transition hover:opacity-90"
                type="button"
                onClick={logout}
              >
                로그아웃
              </button>
            </>
          ) : (
            <>
              <Link
                className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 shadow-sm transition hover:bg-slate-50"
                href="/login"
              >
                로그인
              </Link>
              <Link
                className="rounded-full bg-primary px-4 py-2 text-sm font-bold text-white shadow-sm transition hover:opacity-90"
                href="/signup"
              >
                회원가입
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

export function SideNav({ activePath }: { activePath: string }) {
  const { profile } = useClientAuthProfile();
  const initial = (profile?.nickname ?? 'M').slice(0, 1).toUpperCase();

  return (
    <aside className="fixed left-0 top-0 z-[60] hidden h-screen w-72 flex-col border-r border-slate-200 bg-[#FAF9F6] px-4 pt-6 text-sm font-medium text-slate-800 md:flex">
      <div className="mb-10 px-4">
        <AppLogo size="sm" />
        <p className="text-sm font-medium text-slate-500">AI Fashion Stylist</p>
      </div>

      <nav className="space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActivePath(activePath, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={[
                'flex items-center gap-3 rounded-lg px-4 py-3 transition-all',
                active
                  ? 'translate-x-1 border-r-4 border-slate-900 bg-slate-100/60 font-bold text-slate-900'
                  : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'
              ].join(' ')}
            >
              <Icon size={20} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="mb-6 mt-auto flex items-center gap-3 rounded-2xl bg-white p-4 shadow-sm">
        <div className="grid h-10 w-10 place-items-center rounded-full bg-slate-200 text-sm font-black text-slate-700">
          {initial}
        </div>
        <div>
          <p className="text-sm font-bold text-slate-900">{profile?.nickname ? `${profile.nickname} 님` : 'Guest'}</p>
          <p className="text-xs text-slate-500">{profile ? 'Member' : 'Login required'}</p>
        </div>
      </div>
    </aside>
  );
}

export function BottomNav({ activePath }: { activePath: string }) {
  return (
    <nav className="fixed bottom-0 left-0 z-50 flex h-[72px] w-full items-center justify-around rounded-t-2xl border-t border-slate-100 bg-white px-2 shadow-[0_-4px_12px_rgba(0,0,0,0.05)] md:hidden">
      {navItems.map((item) => {
        const Icon = item.icon;
        const active = isActivePath(activePath, item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={[
              'flex flex-col items-center justify-center rounded-xl px-2 py-2 text-[10px] font-semibold transition-transform duration-150 active:scale-95',
              active ? 'bg-slate-50 text-slate-900' : 'text-slate-400'
            ].join(' ')}
          >
            <Icon size={18} />
            <span className="mt-1">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
