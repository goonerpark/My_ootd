'use client';

import Link from 'next/link';
import { ArrowRight, Camera, CloudSun, Heart, Shirt, Sparkles } from 'lucide-react';
import { useEffect, useState } from 'react';
import { AppShell } from '@/components/layout';
import { fetchOotdPosts, fetchTodayMemberRecommendation, fetchTodayRecommendation, fetchTodayWeather } from '@/lib/api/client';
import type { Gender, OotdPostSummary, TodayRecommendation, TodayWeather } from '@/lib/api/types';
import { getAccessTokenFromStorage, getAuthUserProfileFromStorage } from '@/lib/auth/token';
import { lookCategoryLabels } from '@/lib/community/categories';

function temp(value?: number | null) {
  return typeof value === 'number' ? `${Math.round(value)}°` : '-';
}

export default function HomePage() {
  const [weather, setWeather] = useState<TodayWeather | null>(null);
  const [recommendation, setRecommendation] = useState<TodayRecommendation | null>(null);
  const [posts, setPosts] = useState<OotdPostSummary[]>([]);
  const [nickname, setNickname] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const token = getAccessTokenFromStorage();
      const profile = getAuthUserProfileFromStorage();
      const gender: Gender = profile?.gender ?? 'MALE';
      setNickname(profile?.nickname ?? null);
      setLoading(true);
      try {
        const [weatherData, recommendationData, postPage] = await Promise.all([
          fetchTodayWeather().catch(() => null),
          token ? fetchTodayMemberRecommendation(token, gender).catch(() => null) : fetchTodayRecommendation(gender).catch(() => null),
          fetchOotdPosts({ size: 3 }).catch(() => null)
        ]);
        setWeather(weatherData);
        setRecommendation(recommendationData);
        setPosts(postPage?.content ?? []);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <AppShell activePath="/" withFooter>
      <div className="mx-auto max-w-7xl px-6 py-8">
        <header className="mb-10">
          <h1 className="font-headline text-4xl font-bold text-primary">홈 대시보드</h1>
          <p className="mt-2 text-on-surface-variant">
            {nickname ? `${nickname}님, 오늘은 무엇을 입을까요?` : '오늘은 무엇을 입을까요?'} 날씨와 취향을 반영한 추천을 준비했습니다.
          </p>
        </header>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-12">
          <section className="flex flex-col gap-6 md:col-span-4">
            <article className="group relative overflow-hidden rounded-xl bg-white p-8 shadow-[0_10px_30px_rgba(0,0,0,0.04)]">
              <div className="relative z-10">
                <h2 className="mb-6 font-headline text-2xl font-semibold text-primary">오늘의 날씨</h2>
                <div className="flex items-end justify-between">
                  <div>
                    <span className="text-6xl font-black text-[#5A6D5E]">{loading ? '...' : temp(weather?.currentTemp)}</span>
                    <p className="mt-2 flex items-center gap-2 text-lg font-medium text-on-surface-variant"><CloudSun className="text-amber-400" />{weather?.weatherDescription ?? '날씨 조회 중'}</p>
                  </div>
                  <div className="text-right text-sm text-stone-400">
                    <p>최저 {temp(weather?.minTemp)} / 최고 {temp(weather?.maxTemp)}</p>
                    <p>습도 {weather?.humidity ?? '-'}%</p>
                  </div>
                </div>
              </div>
            </article>

            <article className="flex flex-col gap-6 rounded-xl bg-primary-container p-8 text-on-primary-container">
              <div>
                <span className="mb-4 inline-block rounded-full bg-white/20 px-3 py-1 text-[10px] font-bold uppercase tracking-wider">AI 추천 코디</span>
                <h2 className="mb-2 font-headline text-2xl font-semibold">{recommendation?.topItem ?? '오늘의 추천을 준비 중입니다'}</h2>
                <p className="text-sm leading-relaxed opacity-80">{recommendation?.summaryComment ?? '날씨와 성별 정보를 바탕으로 데일리 룩을 추천합니다.'}</p>
              </div>
              <Link href="/survey" className="flex items-center justify-between rounded-lg bg-white/80 p-4 font-bold text-primary backdrop-blur-md">
                설문으로 맞춤 추천 받기 <ArrowRight size={18} />
              </Link>
            </article>
          </section>

          <section className="flex flex-col gap-10 md:col-span-8">
            <div>
              <div className="mb-6 flex items-end justify-between px-2">
                <h2 className="font-headline text-2xl font-semibold text-primary">오늘의 OOTD</h2>
                <Link href="/ootd-board" className="flex items-center gap-1 text-sm text-stone-400 transition hover:text-primary">전체보기 <ArrowRight size={14} /></Link>
              </div>
              {posts.length === 0 && !loading ? (
                <div className="rounded-2xl border border-dashed border-outline-variant bg-white p-10 text-center text-on-surface-variant">
                  <Shirt className="mx-auto mb-3 text-primary" size={34} />
                  아직 등록된 OOTD가 없습니다. 첫 번째 게시글을 작성해보세요!
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {posts.map((post) => (
                    <Link key={post.postId} href={`/ootd-posts/${post.postId}`} className="group">
                      <div className="relative mb-4 aspect-[4/5] overflow-hidden rounded-xl bg-surface-container-high">
                        {post.thumbnailUrl ? (
                          <img src={post.thumbnailUrl} alt="OOTD" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-sm text-on-surface-variant">이미지 없음</div>
                        )}
                        <div className="absolute bottom-4 left-4 rounded-full bg-stone-900/70 px-3 py-1 text-[10px] font-medium text-white backdrop-blur-md">#{lookCategoryLabels[post.lookCategory] ?? post.lookCategory}</div>
                      </div>
                      <div className="flex items-start justify-between px-2">
                        <div><p className="font-bold text-primary">@{post.authorNickname}</p><p className="text-xs text-stone-400">좋아요 {post.likeCount}개</p></div>
                        <Heart size={18} className="text-stone-300" />
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            <div>
              <div className="mb-6 flex items-end justify-between px-2">
                <h2 className="font-headline text-2xl font-semibold text-primary">빠른 이동</h2>
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <Shortcut href="/closet" icon={<Shirt />} title="나의 옷장" subtitle="내 아이템 관리" />
                <Shortcut href="/ootd" icon={<Camera />} title="OOTD AI 평가" subtitle="오늘 스타일 점수 확인" />
                <Shortcut href="/outfit-inspirations" icon={<Sparkles />} title="코디 추천 피드" subtitle="인기 룩 둘러보기" />
              </div>
            </div>
          </section>
        </div>
      </div>
    </AppShell>
  );
}

function Shortcut({ href, icon, title, subtitle }: { href: string; icon: React.ReactNode; title: string; subtitle: string }) {
  return (
    <Link href={href} className="flex items-center gap-4 rounded-2xl bg-secondary-fixed/30 p-6 transition hover:bg-secondary-fixed/50">
      <span className="rounded-xl bg-white p-3 text-primary">{icon}</span>
      <span><span className="block font-bold text-primary">{title}</span><span className="text-xs text-on-surface-variant">{subtitle}</span></span>
    </Link>
  );
}