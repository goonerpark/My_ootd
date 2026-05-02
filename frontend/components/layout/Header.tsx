'use client';

import Link from 'next/link';
import { Bell, Heart, Search } from 'lucide-react';
import { useEffect, useState } from 'react';
import { clearAccessTokenFromStorage, getAccessTokenFromStorage, getAuthUserProfileFromStorage } from '@/lib/auth/token';

export function Header() {
  const [nickname, setNickname] = useState<string | null>(null);
  const [hasToken, setHasToken] = useState(false);

  useEffect(() => {
    setHasToken(Boolean(getAccessTokenFromStorage()));
    setNickname(getAuthUserProfileFromStorage()?.nickname ?? null);
  }, []);

  const logout = () => {
    clearAccessTokenFromStorage();
    window.location.href = '/';
  };

  return (
    <header className="sticky top-0 z-40 flex w-full items-center justify-between border-b border-stone-100 bg-[#FCFAFA]/80 px-6 py-4 text-[#5A6D5E] shadow-[0_4px_20px_rgba(0,0,0,0.02)] backdrop-blur-md lg:pl-[280px]">
      <Link href="/" className="font-headline text-2xl font-bold tracking-tighter text-[#5A6D5E]">
        my_ootd
      </Link>
      <div className="flex items-center gap-4">
        <div className="hidden items-center rounded-full bg-surface-container-low px-4 py-2 md:flex">
          <Search size={16} className="mr-2" />
          <input className="w-48 border-none bg-transparent p-0 text-sm outline-none focus:ring-0" placeholder="스타일 검색" />
        </div>
        <Heart size={20} className="text-stone-500" />
        <Bell size={20} className="text-stone-500" />
        {hasToken ? (
          <>
            <Link href="/mypage" className="hidden rounded-full border border-outline-variant bg-white px-4 py-2 text-xs font-bold text-primary sm:inline-flex">
              {nickname ? `${nickname} 님` : 'Profile'}
            </Link>
            <button type="button" onClick={logout} className="rounded-full bg-primary px-4 py-2 text-xs font-bold text-white">
              로그아웃
            </button>
          </>
        ) : (
          <>
            <Link href="/login" className="rounded-full border border-outline-variant bg-white px-4 py-2 text-xs font-bold text-primary">
              로그인
            </Link>
            <Link href="/signup" className="rounded-full bg-primary px-4 py-2 text-xs font-bold text-white">
              회원가입
            </Link>
          </>
        )}
      </div>
    </header>
  );
}