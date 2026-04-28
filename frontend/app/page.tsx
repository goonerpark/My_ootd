"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Camera,
  ChevronRight,
  CloudSun,
  Droplets,
  Shirt,
  Sparkles,
  Thermometer,
  UserRound
} from "lucide-react";
import { GenderSelector } from "@/components/GenderSelector";
import { ErrorMessage, PrimaryButton, SecondaryButton } from "@/components/ui";
import { AppShell } from "@/components/layout";
import {
  fetchTodayClosetRecommendation,
  fetchTodayRecommendation,
  fetchTodayWeather,
  fetchWeeklyRecommendations
} from "@/lib/api/client";
import {
  clearAccessTokenFromStorage,
  getAccessTokenFromStorage,
  getAuthUserProfileFromStorage
} from "@/lib/auth/token";
import type {
  Gender,
  RecommendationSlot,
  TodayClosetRecommendation,
  TodayRecommendation,
  TodayWeather,
  WeeklyRecommendationItem
} from "@/lib/api/types";
import { getClosetCategoryLabel, getClosetFitLabel } from "@/lib/closet/options";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080";
const PLACEHOLDER_IMAGE = "/mock/base.svg";

const SLOT_LABEL: Record<RecommendationSlot, string> = {
  TOP: "Top",
  OUTER: "Outer",
  BOTTOM: "Bottom",
  SHOES: "Shoes",
  ACCESSORY: "Accessory"
};

function toKoreanErrorMessage(message: string) {
  if (message === "Unexpected server error") return "서버에서 예기치 못한 오류가 발생했습니다.";
  if (message === "Authentication is required") return "인증이 필요합니다.";
  return message;
}

function normalizeClosetImage(url?: string | null) {
  if (!url) return PLACEHOLDER_IMAGE;
  if (url.startsWith("local://closet-items/")) {
    const filename = url.replace("local://closet-items/", "");
    return `${API_BASE_URL}/uploads/closet-items/${filename}`;
  }
  return url;
}

function formatTemp(value?: number | null) {
  return typeof value === "number" ? `${Math.round(value)}°` : "-";
}

function WeatherSummary({ weather, loading }: { weather: TodayWeather | null; loading: boolean }) {
  return (
    <article className="rounded-xl border border-surface-container-high bg-white p-8 shadow-soft lg:col-span-4">
      <div className="mb-8 flex items-start justify-between">
        <div>
          <p className="font-title-sm text-title-sm text-primary">현재 날씨</p>
          <p className="font-body-md text-body-md text-on-surface-variant">오늘의 외출 기준</p>
        </div>
        <CloudSun className="h-12 w-12 text-primary" />
      </div>

      <div className="mb-6 flex items-baseline gap-2">
        <span className="text-6xl font-extrabold tracking-tighter">{loading ? "..." : formatTemp(weather?.currentTemp)}</span>
        <span className="text-xl text-on-surface-variant">{weather?.weatherDescription ?? weather?.weatherMain ?? "날씨 조회 중"}</span>
      </div>

      <div className="grid grid-cols-2 gap-4 border-t border-surface-container pt-6">
        <div className="space-y-1">
          <p className="text-caption-xs uppercase tracking-wider text-on-surface-variant">최저 / 최고</p>
          <p className="font-bold text-body-md">
            {formatTemp(weather?.minTemp)} / {formatTemp(weather?.maxTemp)}
          </p>
        </div>
        <div className="space-y-1">
          <p className="text-caption-xs uppercase tracking-wider text-on-surface-variant">강수 확률</p>
          <p className="font-bold text-body-md">{weather?.precipitationProbability ?? "-"}%</p>
        </div>
        <div className="space-y-1">
          <p className="text-caption-xs uppercase tracking-wider text-on-surface-variant">습도</p>
          <p className="font-bold text-body-md">{weather?.humidity ?? "-"}%</p>
        </div>
        <div className="space-y-1">
          <p className="text-caption-xs uppercase tracking-wider text-on-surface-variant">체감 포인트</p>
          <p className="font-bold text-body-md text-green-600">{(weather?.precipitationProbability ?? 0) > 50 ? "우산 추천" : "활동하기 좋음"}</p>
        </div>
      </div>
    </article>
  );
}

function DailyRecommendation({
  recommendation,
  loading,
  onSurvey
}: {
  recommendation: TodayRecommendation | null;
  loading: boolean;
  onSurvey: () => void;
}) {
  const rows = [
    ["Top", recommendation?.topItem],
    ["Outer", recommendation?.outerItem],
    ["Bottom", recommendation?.bottomItem],
    ["Shoes", recommendation?.shoesItem],
    ["Accessory", recommendation?.accessoryItem]
  ];

  return (
    <article className="overflow-hidden rounded-xl bg-primary text-white shadow-xl lg:col-span-8">
      <div className="flex flex-col md:flex-row">
        <div className="relative h-64 bg-primary-container md:h-auto md:w-1/2">
          <img className="h-full w-full object-cover opacity-80" src={PLACEHOLDER_IMAGE} alt="오늘 추천 룩" />
          <div className="absolute inset-0 bg-gradient-to-t from-primary/80 to-transparent" />
          <div className="absolute bottom-6 left-6">
            <p className="font-caption-xs text-caption-xs mb-1 opacity-80">AI 스타일링 제안</p>
            <h3 className="font-headline-md text-headline-md">오늘의 데일리 룩</h3>
          </div>
        </div>

        <div className="flex flex-1 flex-col justify-between p-8">
          <div className="space-y-4">
            {rows.map(([label, value]) => (
              <div className="flex items-center justify-between gap-4" key={label}>
                <span className="font-medium text-on-primary-container">{label}</span>
                <span className="text-right font-bold">{loading ? "추천 불러오는 중" : value || "추천 없음"}</span>
              </div>
            ))}
          </div>

          {recommendation?.summaryComment && (
            <p className="mt-6 rounded-2xl bg-white/10 p-4 text-sm leading-relaxed text-slate-200">{recommendation.summaryComment}</p>
          )}

          <button
            className="mt-8 flex w-full items-center justify-center gap-2 rounded-xl bg-white py-4 font-bold text-primary transition-colors hover:bg-slate-100"
            type="button"
            onClick={onSurvey}
          >
            <Sparkles size={18} />
            이 코디는 어떠신가요? 설문으로 맞춤 추천 받기
          </button>
        </div>
      </div>
    </article>
  );
}

function ClosetRecommendations({
  data,
  loading,
  hasToken,
  error
}: {
  data: TodayClosetRecommendation | null;
  loading: boolean;
  hasToken: boolean;
  error: string | null;
}) {
  const cards = data?.closetItems ?? [];

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Sparkles className="rounded-lg bg-tertiary-fixed p-2 text-tertiary" size={38} />
          <h2 className="font-headline-md text-headline-md">나의 옷장 기반 추천</h2>
        </div>
        <Link className="flex items-center gap-1 font-bold text-primary hover:underline" href="/closet">
          전체보기 <ChevronRight size={16} />
        </Link>
      </div>

      {!hasToken && (
        <div className="rounded-2xl border border-dashed border-outline-variant bg-white p-6 text-on-surface-variant shadow-soft">
          로그인하면 등록한 옷장 아이템으로 오늘의 착장을 추천받을 수 있습니다.
        </div>
      )}
      {hasToken && loading && <div className="rounded-2xl bg-white p-6 shadow-soft">옷장 추천 정보를 불러오는 중입니다...</div>}
      {hasToken && !loading && error && <ErrorMessage message={error} />}
      {hasToken && !loading && !error && data && cards.length === 0 && (
        <div className="rounded-2xl bg-white p-6 text-on-surface-variant shadow-soft">
          현재 조건에 맞는 옷장 아이템이 없어 기본 추천을 제공합니다. {data.summaryComment}
        </div>
      )}
      {hasToken && !loading && !error && cards.length > 0 && (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {cards.slice(0, 3).map((item) => (
            <article
              className="overflow-hidden rounded-xl border border-surface-container bg-white shadow-sm transition-shadow hover:shadow-md"
              key={`${item.slot}-${item.closetItemId}`}
            >
              <div className="h-64 overflow-hidden bg-surface-container-low">
                <img
                  className="h-full w-full object-cover transition-transform duration-500 hover:scale-105"
                  src={normalizeClosetImage(item.imageUrl)}
                  alt={`${SLOT_LABEL[item.slot]} 추천 아이템`}
                />
              </div>
              <div className="space-y-3 p-5">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <span className="rounded bg-surface-container px-2 py-1 text-[10px] font-bold uppercase text-on-surface-variant">
                    {SLOT_LABEL[item.slot]}
                  </span>
                  <span className="text-xs font-bold text-amber-500">Best Match</span>
                </div>
                <h4 className="text-lg font-bold">{item.brand || item.subcategory || getClosetCategoryLabel(item.category)}</h4>
                <p className="text-caption-xs leading-relaxed text-on-surface-variant">
                  {item.color ?? "-"} / {getClosetFitLabel(item.fit)}
                </p>
                <p className="text-caption-xs leading-relaxed text-on-surface-variant">"{item.reason}"</p>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

export default function HomePage() {
  const router = useRouter();
  const [hasToken, setHasToken] = useState(false);
  const [gender, setGender] = useState<Gender>("MALE");
  const [weather, setWeather] = useState<TodayWeather | null>(null);
  const [recommendation, setRecommendation] = useState<TodayRecommendation | null>(null);
  const [closetRecommendation, setClosetRecommendation] = useState<TodayClosetRecommendation | null>(null);
  const [weeklyRecommendations, setWeeklyRecommendations] = useState<WeeklyRecommendationItem[]>([]);
  const [dateIndex, setDateIndex] = useState(0);
  const [loadingWeather, setLoadingWeather] = useState(false);
  const [loadingRecommendation, setLoadingRecommendation] = useState(false);
  const [loadingClosetRecommendation, setLoadingClosetRecommendation] = useState(false);
  const [loadingWeekly, setLoadingWeekly] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [closetError, setClosetError] = useState<string | null>(null);
  const [showMemberOnlyModal, setShowMemberOnlyModal] = useState(false);
  const [nickname, setNickname] = useState<string | null>(null);

  const todayLabel = useMemo(
    () =>
      new Intl.DateTimeFormat("ko-KR", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric"
      }).format(new Date()),
    []
  );

  useEffect(() => {
    setHasToken(Boolean(getAccessTokenFromStorage()));
    setNickname(getAuthUserProfileFromStorage()?.nickname ?? null);
  }, []);

  useEffect(() => {
    const token = getAccessTokenFromStorage();
    if (!token) {
      setWeeklyRecommendations([]);
      setClosetRecommendation(null);
      setClosetError(null);
      setDateIndex(0);
      return;
    }
    const loadWeekly = async () => {
      setLoadingWeekly(true);
      setError(null);
      try {
        const data = await fetchWeeklyRecommendations(token);
        setWeeklyRecommendations(data);
        setDateIndex(0);
      } catch (err) {
        const message = err instanceof Error ? toKoreanErrorMessage(err.message) : "주간 추천 정보를 불러오지 못했습니다.";
        setError(message);
      } finally {
        setLoadingWeekly(false);
      }
    };
    loadWeekly();
  }, [hasToken]);

  useEffect(() => {
    const token = getAccessTokenFromStorage();
    if (!token) {
      setClosetRecommendation(null);
      setClosetError(null);
      return;
    }
    const loadClosetRecommendation = async () => {
      setLoadingClosetRecommendation(true);
      setClosetError(null);
      try {
        const data = await fetchTodayClosetRecommendation(token);
        setClosetRecommendation(data);
      } catch (err) {
        const message = err instanceof Error ? toKoreanErrorMessage(err.message) : "옷장 추천 정보를 불러오지 못했습니다.";
        setClosetError(message);
      } finally {
        setLoadingClosetRecommendation(false);
      }
    };
    loadClosetRecommendation();
  }, [hasToken]);

  useEffect(() => {
    const loadWeather = async () => {
      setLoadingWeather(true);
      setError(null);
      try {
        const data = await fetchTodayWeather();
        setWeather(data);
      } catch (err) {
        const message = err instanceof Error ? toKoreanErrorMessage(err.message) : "날씨 정보를 불러오지 못했습니다.";
        setError(message);
      } finally {
        setLoadingWeather(false);
      }
    };
    loadWeather();
  }, []);

  useEffect(() => {
    const loadRecommendation = async () => {
      setLoadingRecommendation(true);
      setError(null);
      try {
        const data = await fetchTodayRecommendation(gender);
        setRecommendation(data);
      } catch (err) {
        const message = err instanceof Error ? toKoreanErrorMessage(err.message) : "추천 정보를 불러오지 못했습니다.";
        setError(message);
      } finally {
        setLoadingRecommendation(false);
      }
    };
    loadRecommendation();
  }, [gender]);

  const goToRecommendationFlow = () => router.push(hasToken ? "/survey" : "/login");
  const selectedWeeklyItem = hasToken ? weeklyRecommendations[dateIndex] : undefined;

  const displayedWeather: TodayWeather | null = useMemo(() => {
    if (!selectedWeeklyItem) return weather;
    return {
      targetDate: selectedWeeklyItem.targetDate,
      regionCode: "SEOUL",
      weatherMain: selectedWeeklyItem.weather.weatherMain,
      weatherDescription: selectedWeeklyItem.weather.weatherDescription,
      precipitationProbability: selectedWeeklyItem.weather.precipitationProbability,
      minTemp: selectedWeeklyItem.weather.minTemp,
      maxTemp: selectedWeeklyItem.weather.maxTemp,
      currentTemp: selectedWeeklyItem.weather.currentTemp,
      humidity: selectedWeeklyItem.weather.humidity,
      fetchedAt: new Date().toISOString()
    };
  }, [selectedWeeklyItem, weather]);

  const displayedRecommendation: TodayRecommendation | null = useMemo(() => {
    if (!selectedWeeklyItem) return recommendation;
    return {
      recommendationId: 0,
      userId: null,
      targetDate: selectedWeeklyItem.targetDate,
      gender,
      topItem: selectedWeeklyItem.recommendation.top,
      outerItem: selectedWeeklyItem.recommendation.outer,
      bottomItem: selectedWeeklyItem.recommendation.bottom,
      shoesItem: selectedWeeklyItem.recommendation.shoes,
      accessoryItem: selectedWeeklyItem.recommendation.accessory,
      summaryComment: selectedWeeklyItem.recommendation.comment,
      weather: displayedWeather as TodayWeather
    };
  }, [selectedWeeklyItem, recommendation, gender, displayedWeather]);

  const dateLabel = useMemo(() => {
    if (!selectedWeeklyItem) return todayLabel;
    return new Intl.DateTimeFormat("ko-KR", { weekday: "long", year: "numeric", month: "long", day: "numeric" }).format(
      new Date(selectedWeeklyItem.targetDate)
    );
  }, [selectedWeeklyItem, todayLabel]);

  const moveDate = (direction: "prev" | "next") => {
    if (!hasToken) {
      setShowMemberOnlyModal(true);
      return;
    }
    if (weeklyRecommendations.length === 0) return;
    setDateIndex((prev) => (direction === "prev" ? Math.max(prev - 1, 0) : Math.min(prev + 1, weeklyRecommendations.length - 1)));
  };

  return (
    <AppShell activePath="/">
      <div className="space-y-8">
        <section className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <h1 className="font-display-lg text-display-lg text-primary">안녕하세요, {nickname ?? "방문자"}님!</h1>
            <p className="mt-2 flex items-center gap-2 font-body-lg text-body-lg text-on-surface-variant">
              <CalendarDays size={22} />
              {dateLabel}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              className="rounded-full border border-outline-variant bg-white p-2 text-primary shadow-sm disabled:opacity-40"
              type="button"
              onClick={() => moveDate("prev")}
              disabled={hasToken && dateIndex === 0}
              aria-label="이전 날짜"
            >
              <ArrowLeft size={18} />
            </button>
            <button
              className="rounded-full border border-outline-variant bg-white p-2 text-primary shadow-sm disabled:opacity-40"
              type="button"
              onClick={() => moveDate("next")}
              disabled={hasToken && weeklyRecommendations.length > 0 && dateIndex === weeklyRecommendations.length - 1}
              aria-label="다음 날짜"
            >
              <ArrowRight size={18} />
            </button>
            <span className="rounded-full bg-secondary-container px-4 py-2 text-caption-xs font-semibold text-on-secondary-container">
              활동하기 좋음
            </span>
            <span className="rounded-full bg-tertiary-fixed px-4 py-2 text-caption-xs font-semibold text-on-tertiary-fixed-variant">
              {(displayedWeather?.precipitationProbability ?? 0) > 50 ? "우산 추천" : "외출 추천"}
            </span>
          </div>
        </section>

        {error && <ErrorMessage message={error} />}

        <section className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <WeatherSummary weather={displayedWeather} loading={loadingWeather || loadingWeekly} />
          <DailyRecommendation recommendation={displayedRecommendation} loading={loadingRecommendation || loadingWeekly} onSurvey={goToRecommendationFlow} />
        </section>

        <section className="grid gap-6 lg:grid-cols-[1fr_340px]">
          <div className="rounded-2xl border border-surface-container bg-white p-6 shadow-soft">
            <h2 className="mb-3 font-title-sm text-title-sm">성별 기반 기본 추천</h2>
            <GenderSelector value={gender} onChange={setGender} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Link className="rounded-2xl bg-secondary-fixed/40 p-5 transition hover:bg-secondary-fixed" href="/closet">
              <Shirt className="mb-3 text-primary" size={28} />
              <h3 className="font-bold">내 옷장 관리</h3>
              <p className="text-caption-xs text-on-surface-variant">새 아이템 등록하기</p>
            </Link>
            <Link className="rounded-2xl bg-tertiary-fixed/50 p-5 transition hover:bg-tertiary-fixed" href="/ootd">
              <Camera className="mb-3 text-primary" size={28} />
              <h3 className="font-bold">OOTD 평가</h3>
              <p className="text-caption-xs text-on-surface-variant">오늘 스타일 점수</p>
            </Link>
            <Link className="rounded-2xl bg-surface-container-high/60 p-5 transition hover:bg-surface-container-high" href="/survey">
              <Thermometer className="mb-3 text-primary" size={28} />
              <h3 className="font-bold">설문 작성</h3>
              <p className="text-caption-xs text-on-surface-variant">추천 정확도 높이기</p>
            </Link>
            <Link className="rounded-2xl bg-white p-5 shadow-soft transition hover:bg-slate-50" href="/mypage">
              <UserRound className="mb-3 text-primary" size={28} />
              <h3 className="font-bold">마이페이지</h3>
              <p className="text-caption-xs text-on-surface-variant">내 활동 확인</p>
            </Link>
          </div>
        </section>

        <ClosetRecommendations
          data={closetRecommendation}
          loading={loadingClosetRecommendation}
          hasToken={hasToken}
          error={closetError}
        />

        <section className="rounded-2xl border border-surface-container bg-white p-6 shadow-soft">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-title-sm text-title-sm">오늘 추천 플로우</h2>
              <p className="mt-1 text-sm text-on-surface-variant">설문을 작성하면 Gemini 기반 맞춤 추천 결과로 이어집니다.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <PrimaryButton onClick={goToRecommendationFlow}>오늘의 옷 추천</PrimaryButton>
              {hasToken && (
                <SecondaryButton
                  onClick={() => {
                    clearAccessTokenFromStorage();
                    setHasToken(false);
                    setDateIndex(0);
                  }}
                >
                  로그아웃
                </SecondaryButton>
              )}
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2 text-sm text-on-surface-variant">
            <Droplets size={16} />
            <span>날씨, 기온, 습도, 강수확률과 설문 답변을 함께 분석합니다.</span>
          </div>
        </section>
      </div>

      {showMemberOnlyModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label="회원 전용 안내">
          <div className="w-full max-w-md rounded-[28px] border border-surface-container bg-white p-6 shadow-card">
            <h3 className="text-xl font-bold">회원 전용 기능입니다.</h3>
            <p className="mt-2 text-sm text-on-surface-variant">로그인하면 날짜별 추천을 확인할 수 있습니다.</p>
            <div className="mt-5 flex flex-wrap gap-2">
              <PrimaryButton
                onClick={() => {
                  setShowMemberOnlyModal(false);
                  router.push("/login");
                }}
              >
                로그인
              </PrimaryButton>
              <SecondaryButton
                onClick={() => {
                  setShowMemberOnlyModal(false);
                  router.push("/signup");
                }}
              >
                회원가입
              </SecondaryButton>
              <SecondaryButton onClick={() => setShowMemberOnlyModal(false)}>닫기</SecondaryButton>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
