"use client";

import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
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
import { RecommendationFeedbackPanel } from "@/components/RecommendationFeedbackPanel";
import { AppShell } from "@/components/layout";
import { ErrorMessage, PrimaryButton, SecondaryButton } from "@/components/ui";
import {
  fetchTodayClosetRecommendation,
  fetchTodayMemberRecommendation,
  fetchTodayRecommendation,
  fetchTodayWeather,
  fetchWeeklyRecommendations
} from "@/lib/api/client";
import {
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
import {
  getLatestRecommendationFeedback,
  saveRecommendationFeedback,
  type RecommendationFeedbackValue
} from "@/lib/recommendation/feedback";

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
        <WeatherMetric label="최저 / 최고" value={`${formatTemp(weather?.minTemp)} / ${formatTemp(weather?.maxTemp)}`} />
        <WeatherMetric label="강수 확률" value={`${weather?.precipitationProbability ?? "-"}%`} />
        <WeatherMetric label="습도" value={`${weather?.humidity ?? "-"}%`} />
        <WeatherMetric label="추천 힌트" value={(weather?.precipitationProbability ?? 0) > 50 ? "우천 대비" : "활동하기 좋음"} accent />
      </div>
    </article>
  );
}

function WeatherMetric({ label, value, accent = false }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="space-y-1">
      <p className="text-caption-xs uppercase tracking-wider text-on-surface-variant">{label}</p>
      <p className={`font-bold text-body-md ${accent ? "text-green-600" : ""}`}>{value}</p>
    </div>
  );
}

function DailyRecommendation({
  recommendation,
  loading,
  onSurvey,
  selectedFeedback,
  onFeedback
}: {
  recommendation: TodayRecommendation | null;
  loading: boolean;
  onSurvey: () => void;
  selectedFeedback: RecommendationFeedbackValue | null;
  onFeedback: (value: RecommendationFeedbackValue) => void;
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
            <span className="flex flex-col leading-tight">
              <span>이 코디는 어떠신가요?</span>
              <span>설문으로 맞춤 추천 받기</span>
            </span>
          </button>

          {!loading && recommendation && (
            <RecommendationFeedbackPanel selected={selectedFeedback} onSelect={onFeedback} compact />
          )}
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
      {hasToken && !loading && error && (
        <div className="rounded-2xl border border-dashed border-outline-variant bg-white p-6 text-on-surface-variant shadow-soft">
          <p className="font-bold text-primary">아직 옷장 기반 추천을 준비하지 못했어요.</p>
          <p className="mt-2 text-sm">
            옷장 아이템이 부족하거나 추천 조건이 맞지 않으면 이 영역은 자연스럽게 비워둘게요. 옷을 몇 개 등록하면 날씨에 맞는 내 옷장 추천을 볼 수 있습니다.
          </p>
          <Link className="mt-4 inline-flex rounded-full bg-primary px-4 py-2 text-sm font-bold text-white" href="/closet">
            옷장 등록하러 가기
          </Link>
        </div>
      )}
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
  const [authGender, setAuthGender] = useState<Gender | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [recommendationCache, setRecommendationCache] = useState<Partial<Record<Gender, TodayRecommendation>>>({});
  const [selectedFeedback, setSelectedFeedback] = useState<RecommendationFeedbackValue | null>(null);

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
    const token = getAccessTokenFromStorage();
    const profile = getAuthUserProfileFromStorage();
    setHasToken(Boolean(token));
    setNickname(profile?.nickname ?? null);
    setAuthGender(profile?.gender ?? null);
    if (profile?.gender) {
      setGender(profile.gender);
    }
    setAuthReady(true);
    setSelectedFeedback(getLatestRecommendationFeedback()?.value ?? null);
  }, []);

  useEffect(() => {
    const loadWeather = async () => {
      setLoadingWeather(true);
      setError(null);
      try {
        setWeather(await fetchTodayWeather());
      } catch (err) {
        setError(err instanceof Error ? toKoreanErrorMessage(err.message) : "날씨 정보를 불러오지 못했습니다.");
      } finally {
        setLoadingWeather(false);
      }
    };
    loadWeather();
  }, []);

  useEffect(() => {
    const loadRecommendation = async () => {
      if (!authReady) {
        return;
      }

      const cached = recommendationCache[gender];
      if (cached) {
        setRecommendation(cached);
        setLoadingRecommendation(false);
        return;
      }

      setLoadingRecommendation(true);
      setError(null);
      try {
        const token = getAccessTokenFromStorage();
        const data = token
          ? await fetchTodayMemberRecommendation(token, gender)
          : await fetchTodayRecommendation(gender);
        setRecommendation(data);
        setRecommendationCache((prev) => ({ ...prev, [gender]: data }));
      } catch (err) {
        setError(err instanceof Error ? toKoreanErrorMessage(err.message) : "추천 정보를 불러오지 못했습니다.");
      } finally {
        setLoadingRecommendation(false);
      }
    };
    loadRecommendation();
  }, [authReady, gender, recommendationCache]);

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
        setError(err instanceof Error ? toKoreanErrorMessage(err.message) : "주간 추천 정보를 불러오지 못했습니다.");
      } finally {
        setLoadingWeekly(false);
      }
    };

    const loadClosetRecommendation = async () => {
      setLoadingClosetRecommendation(true);
      setClosetError(null);
      try {
        setClosetRecommendation(await fetchTodayClosetRecommendation(token));
      } catch (err) {
        setClosetError(err instanceof Error ? toKoreanErrorMessage(err.message) : "옷장 추천 정보를 불러오지 못했습니다.");
      } finally {
        setLoadingClosetRecommendation(false);
      }
    };

    loadWeekly();
    loadClosetRecommendation();
  }, [hasToken]);

  const selectedWeeklyItem = hasToken && dateIndex > 0 ? weeklyRecommendations[dateIndex] : undefined;

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
      recommendationId: dateIndex,
      userId: null,
      targetDate: selectedWeeklyItem.targetDate,
      gender,
      topItem: selectedWeeklyItem.recommendation.top,
      outerItem: selectedWeeklyItem.recommendation.outer,
      bottomItem: selectedWeeklyItem.recommendation.bottom,
      shoesItem: selectedWeeklyItem.recommendation.shoes,
      accessoryItem: selectedWeeklyItem.recommendation.accessory,
      summaryComment: selectedWeeklyItem.recommendation.comment,
      weather: displayedWeather ?? weather!
    };
  }, [dateIndex, displayedWeather, gender, recommendation, selectedWeeklyItem, weather]);

  const goToRecommendationFlow = () => router.push(hasToken ? "/survey" : "/login");

  const saveFeedback = (value: RecommendationFeedbackValue) => {
    setSelectedFeedback(value);
    saveRecommendationFeedback(value, {
      recommendationId: displayedRecommendation?.recommendationId ?? null,
      targetDate: displayedRecommendation?.targetDate ?? null,
      source: "dashboard"
    });
  };

  return (
    <AppShell activePath="/">
      <div className="space-y-8">
        <section className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="mb-2 flex items-center gap-2 text-on-surface-variant">
              <CalendarDays size={18} />
              {selectedWeeklyItem?.targetDate ?? todayLabel}
            </p>
            <h1 className="font-display-lg text-display-lg text-primary">
              {nickname ? `안녕하세요, ${nickname}님!` : "오늘의 룩을 준비해볼까요?"}
            </h1>
            <p className="mt-2 text-body-lg text-on-surface-variant">날씨와 취향을 반영해 오늘 입기 좋은 옷차림을 추천합니다.</p>
          </div>

        </section>

        {hasToken && weeklyRecommendations.length > 0 && (
          <section className="flex items-center justify-center gap-4">
            <button
              className="rounded-full border border-surface-container-high bg-white p-3 disabled:opacity-40"
              type="button"
              disabled={dateIndex <= 0 || loadingWeekly}
              onClick={() => setDateIndex((value) => Math.max(0, value - 1))}
            >
              <ArrowLeft size={18} />
            </button>
            <span className="rounded-full bg-white px-5 py-2 text-sm font-bold text-primary shadow-soft">
              {dateIndex + 1} / {weeklyRecommendations.length}
            </span>
            <button
              className="rounded-full border border-surface-container-high bg-white p-3 disabled:opacity-40"
              type="button"
              disabled={dateIndex >= weeklyRecommendations.length - 1 || loadingWeekly}
              onClick={() => setDateIndex((value) => Math.min(weeklyRecommendations.length - 1, value + 1))}
            >
              <ArrowRight size={18} />
            </button>
          </section>
        )}

        {error && <ErrorMessage message={error} />}

        <section className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <WeatherSummary weather={displayedWeather} loading={loadingWeather || (dateIndex > 0 && loadingWeekly)} />
          <DailyRecommendation
            recommendation={displayedRecommendation}
            loading={loadingRecommendation || (dateIndex > 0 && loadingWeekly)}
            onSurvey={goToRecommendationFlow}
            selectedFeedback={selectedFeedback}
            onFeedback={saveFeedback}
          />
        </section>

        {!hasToken && (
          <section className="rounded-2xl border border-dashed border-outline-variant bg-white p-6 shadow-soft">
            <div className="mb-4">
              <h2 className="text-xl font-bold text-primary">성별 선택</h2>
              <p className="text-sm text-on-surface-variant">비회원은 성별과 오늘 날씨 기반 기본 추천을 볼 수 있습니다.</p>
            </div>
            <GenderSelector value={gender} onChange={setGender} />
          </section>
        )}

        <ClosetRecommendations
          data={closetRecommendation}
          loading={loadingClosetRecommendation}
          hasToken={hasToken}
          error={closetError}
        />

        <section className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <Shortcut href="/closet" icon={<Shirt size={28} />} title="내 옷장 관리" subtitle="새 아이템 등록하기" />
          <Shortcut href="/ootd" icon={<Camera size={28} />} title="OOTD 평가" subtitle="오늘 내 스타일 점수는?" />
          <Shortcut href="/mypage" icon={<UserRound size={28} />} title="마이페이지" subtitle="내 스타일 정보 관리" />
        </section>

        <section className="rounded-2xl bg-white p-6 shadow-soft">
          <h2 className="mb-4 text-xl font-bold text-primary">오늘 추천 흐름</h2>
          <div className="grid gap-4 md:grid-cols-3">
            <FlowItem icon={<Thermometer size={22} />} title="날씨 분석" description="기온, 습도, 강수확률을 확인합니다." />
            <FlowItem icon={<Droplets size={22} />} title="설문 반영" description="외출 목적과 메모를 추천에 반영합니다." />
            <FlowItem icon={<Sparkles size={22} />} title="Gemini 추천" description="프로필과 날씨를 함께 분석합니다." />
          </div>
        </section>
      </div>

      {showMemberOnlyModal && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/40 px-6">
          <div className="max-w-sm rounded-3xl bg-white p-8 shadow-2xl">
            <h2 className="text-xl font-bold text-primary">회원 전용 기능입니다.</h2>
            <p className="mt-2 text-sm text-on-surface-variant">로그인하면 주간 추천과 옷장 기반 추천을 사용할 수 있습니다.</p>
            <div className="mt-6 flex gap-3">
              <PrimaryButton onClick={() => router.push("/login")}>로그인</PrimaryButton>
              <SecondaryButton onClick={() => setShowMemberOnlyModal(false)}>닫기</SecondaryButton>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}

function Shortcut({ href, icon, title, subtitle }: { href: string; icon: ReactNode; title: string; subtitle: string }) {
  return (
    <Link className="group flex items-center gap-4 rounded-2xl bg-secondary-fixed/30 p-6 transition-colors hover:bg-secondary-fixed/50" href={href}>
      <span className="rounded-xl bg-white p-3 text-primary transition-transform group-hover:scale-110">{icon}</span>
      <span>
        <span className="block font-bold text-primary">{title}</span>
        <span className="text-caption-xs text-on-surface-variant">{subtitle}</span>
      </span>
    </Link>
  );
}

function FlowItem({ icon, title, description }: { icon: ReactNode; title: string; description: string }) {
  return (
    <div className="rounded-2xl bg-surface-container-low p-5">
      <div className="mb-3 text-primary">{icon}</div>
      <h3 className="font-bold text-primary">{title}</h3>
      <p className="mt-1 text-sm text-on-surface-variant">{description}</p>
    </div>
  );
}
