'use client';

import Link from 'next/link';
import { ArrowLeft, ArrowRight, Camera, CloudSun, Heart, Shirt, Sparkles } from 'lucide-react';
import { useEffect, useState } from 'react';
import { AppShell } from '@/components/layout';
import { fetchOotdPosts, fetchTodayMemberRecommendation, fetchTodayRecommendation, fetchTodayWeather, fetchWeeklyRecommendations } from '@/lib/api/client';
import type { Gender, OotdPostSummary, TodayRecommendation, TodayWeather, WeeklyRecommendationItem } from '@/lib/api/types';
import { getAccessTokenFromStorage, getAuthUserProfileFromStorage } from '@/lib/auth/token';
import { lookCategoryLabels } from '@/lib/community/categories';

function temp(value?: number | null) {
  return typeof value === 'number' ? `${Math.round(value)}°` : '-';
}

function formatDateLabel(date: string) {
  const parsed = new Date(`${date}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return date;
  return new Intl.DateTimeFormat('ko-KR', { month: 'long', day: 'numeric', weekday: 'short' }).format(parsed);
}

export default function HomePage() {
  const [weather, setWeather] = useState<TodayWeather | null>(null);
  const [recommendation, setRecommendation] = useState<TodayRecommendation | null>(null);
  const [weeklyRecommendations, setWeeklyRecommendations] = useState<WeeklyRecommendationItem[]>([]);
  const [selectedRecommendationIndex, setSelectedRecommendationIndex] = useState(0);
  const [posts, setPosts] = useState<OotdPostSummary[]>([]);
  const [nickname, setNickname] = useState<string | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [authNoticeOpen, setAuthNoticeOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const selectedWeeklyRecommendation = weeklyRecommendations[selectedRecommendationIndex] ?? null;
  const displayRecommendation = selectedWeeklyRecommendation
    ? {
        targetDate: selectedWeeklyRecommendation.targetDate,
        weather: selectedWeeklyRecommendation.weather,
        top: selectedWeeklyRecommendation.recommendation.top,
        outer: selectedWeeklyRecommendation.recommendation.outer,
        bottom: selectedWeeklyRecommendation.recommendation.bottom,
        shoes: selectedWeeklyRecommendation.recommendation.shoes,
        accessory: selectedWeeklyRecommendation.recommendation.accessory,
        comment: selectedWeeklyRecommendation.recommendation.comment
      }
    : recommendation
      ? {
          targetDate: recommendation.targetDate,
          weather: recommendation.weather,
          top: recommendation.topItem,
          outer: recommendation.outerItem,
          bottom: recommendation.bottomItem,
          shoes: recommendation.shoesItem,
          accessory: recommendation.accessoryItem,
          comment: recommendation.summaryComment
        }
      : null;

  useEffect(() => {
    const load = async () => {
      const token = getAccessTokenFromStorage();
      const profile = getAuthUserProfileFromStorage();
      const gender: Gender = profile?.gender ?? 'MALE';
      setNickname(profile?.nickname ?? null);
      setIsLoggedIn(Boolean(token));
      setLoading(true);
      try {
        const [weatherData, recommendationData, weeklyData, postPage] = await Promise.all([
          fetchTodayWeather().catch(() => null),
          token ? fetchTodayMemberRecommendation(token, gender).catch(() => null) : fetchTodayRecommendation(gender).catch(() => null),
          token ? fetchWeeklyRecommendations(token).catch(() => []) : Promise.resolve([]),
          fetchOotdPosts({ size: 3 }).catch(() => null)
        ]);
        setWeather(weatherData);
        setRecommendation(recommendationData);
        setWeeklyRecommendations((weeklyData ?? []).slice(0, 8));
        setSelectedRecommendationIndex(0);
        setPosts(postPage?.content ?? []);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const moveRecommendationDate = (direction: -1 | 1) => {
    if (!isLoggedIn) {
      window.alert('날짜별 AI 추천은 로그인이 필요한 기능입니다.');
      setAuthNoticeOpen(true);
      return;
    }

    if (weeklyRecommendations.length === 0) return;
    setSelectedRecommendationIndex((current) => {
      const next = current + direction;
      if (next < 0) return 0;
      if (next >= weeklyRecommendations.length) return weeklyRecommendations.length - 1;
      return next;
    });
  };

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

            <article className="flex flex-col gap-5 rounded-xl bg-primary-container p-6 text-on-primary-container shadow-[0_10px_30px_rgba(0,0,0,0.04)]">
              <div className="flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => moveRecommendationDate(-1)}
                  disabled={isLoggedIn && selectedRecommendationIndex === 0}
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 transition hover:bg-white/30 disabled:cursor-not-allowed disabled:opacity-40"
                  aria-label="이전 날짜 추천"
                >
                  <ArrowLeft size={18} />
                </button>
                <div className="text-center">
                  <span className="mb-2 inline-block rounded-full bg-white/20 px-3 py-1 text-[10px] font-bold uppercase tracking-wider">날씨별 AI 추천 코디</span>
                  <p className="font-headline text-xl font-semibold">
                    {displayRecommendation ? formatDateLabel(displayRecommendation.targetDate) : '추천 준비 중'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => moveRecommendationDate(1)}
                  disabled={isLoggedIn && selectedRecommendationIndex >= weeklyRecommendations.length - 1}
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 transition hover:bg-white/30 disabled:cursor-not-allowed disabled:opacity-40"
                  aria-label="다음 날짜 추천"
                >
                  <ArrowRight size={18} />
                </button>
              </div>

              {displayRecommendation ? (
                <div className="space-y-4">
                  <div className="rounded-2xl bg-white/15 p-4">
                    <p className="text-xs font-bold uppercase tracking-wider opacity-75">Weather</p>
                    <p className="mt-1 text-sm font-semibold">
                      {displayRecommendation.weather.weatherDescription} · {temp(displayRecommendation.weather.minTemp)} / {temp(displayRecommendation.weather.maxTemp)}
                    </p>
                    <p className="mt-1 text-xs opacity-75">강수확률 {displayRecommendation.weather.precipitationProbability ?? '-'}% · 습도 {displayRecommendation.weather.humidity ?? '-'}%</p>
                  </div>
                  <div className="grid gap-2 text-sm">
                    <RecommendationLine label="Top" value={displayRecommendation.top} />
                    <RecommendationLine label="Outer" value={displayRecommendation.outer} />
                    <RecommendationLine label="Bottom" value={displayRecommendation.bottom} />
                    <RecommendationLine label="Shoes" value={displayRecommendation.shoes} />
                    <RecommendationLine label="Acc" value={displayRecommendation.accessory} />
                  </div>
                  <p className="rounded-2xl bg-white/15 p-4 text-sm leading-relaxed">{displayRecommendation.comment ?? '날씨와 취향을 반영해 추천한 코디입니다.'}</p>
                </div>
              ) : (
                <div>
                  <h2 className="mb-2 font-headline text-2xl font-semibold">추천을 준비 중입니다</h2>
                  <p className="text-sm leading-relaxed opacity-80">날씨와 사용자 정보를 바탕으로 날짜별 데일리 룩을 불러오고 있습니다.</p>
                </div>
              )}

              {authNoticeOpen ? (
                <div className="rounded-2xl bg-white p-4 text-primary shadow-sm">
                  <p className="text-sm font-bold">로그인하면 오늘부터 +7일까지 날짜별 AI 추천을 볼 수 있어요.</p>
                  <div className="mt-3 flex gap-2">
                    <Link href="/login" className="flex-1 rounded-full bg-primary px-4 py-2 text-center text-sm font-bold text-white">로그인</Link>
                    <Link href="/signup" className="flex-1 rounded-full border border-primary px-4 py-2 text-center text-sm font-bold text-primary">회원가입</Link>
                  </div>
                </div>
              ) : null}

              <div className="flex items-center justify-between text-xs font-semibold opacity-75">
                <span>{isLoggedIn ? `${selectedRecommendationIndex + 1} / ${Math.max(weeklyRecommendations.length, 1)}` : '로그인 시 날짜 이동 가능'}</span>
                <span>최대 +7일</span>
              </div>
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

function RecommendationLine({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="flex items-start justify-between gap-3 rounded-xl bg-white/10 px-3 py-2">
      <span className="text-xs font-bold uppercase tracking-wider opacity-70">{label}</span>
      <span className="text-right font-bold">{value || '없음'}</span>
    </div>
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
