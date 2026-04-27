"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { GenderSelector } from "@/components/GenderSelector";
import { ClosetRecommendationCard } from "@/components/ClosetRecommendationCard";
import { RecommendationCard } from "@/components/RecommendationCard";
import { WeatherCard } from "@/components/WeatherCard";
import { ErrorMessage, PageHeader, PrimaryButton, SectionCard, SecondaryButton } from "@/components/ui";
import {
  fetchTodayClosetRecommendation,
  fetchTodayRecommendation,
  fetchTodayWeather,
  fetchWeeklyRecommendations
} from "@/lib/api/client";
import { clearAccessTokenFromStorage, getAccessTokenFromStorage } from "@/lib/auth/token";
import type {
  Gender,
  TodayClosetRecommendation,
  TodayRecommendation,
  TodayWeather,
  WeeklyRecommendationItem
} from "@/lib/api/types";

function toKoreanErrorMessage(message: string) {
  if (message === "Unexpected server error") {
    return "서버에서 예기치 못한 오류가 발생했습니다.";
  }
  if (message === "Authentication is required") {
    return "인증이 필요합니다.";
  }
  return message;
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

  const goToRecommendationFlow = () => {
    router.push(hasToken ? "/survey" : "/login");
  };

  const selectedWeeklyItem = hasToken ? weeklyRecommendations[dateIndex] : undefined;

  const displayedWeather: TodayWeather | null = useMemo(() => {
    if (selectedWeeklyItem) {
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
    }
    return weather;
  }, [selectedWeeklyItem, weather]);

  const displayedRecommendation: TodayRecommendation | null = useMemo(() => {
    if (selectedWeeklyItem) {
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
    }
    return recommendation;
  }, [selectedWeeklyItem, recommendation, gender, displayedWeather]);

  const dateLabel = useMemo(() => {
    if (!selectedWeeklyItem) {
      return todayLabel;
    }
    return new Intl.DateTimeFormat("ko-KR", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric"
    }).format(new Date(selectedWeeklyItem.targetDate));
  }, [selectedWeeklyItem, todayLabel]);

  const moveDate = (direction: "prev" | "next") => {
    if (!hasToken) {
      setShowMemberOnlyModal(true);
      return;
    }
    if (weeklyRecommendations.length === 0) {
      return;
    }
    setDateIndex((prev) => {
      if (direction === "prev") {
        return Math.max(prev - 1, 0);
      }
      return Math.min(prev + 1, weeklyRecommendations.length - 1);
    });
  };

  return (
    <main className="page">
      <section className="container">
        <PageHeader title="OOTD Daily MVP" subtitle={todayLabel} />

        <div className="dateNavigator">
          <button
            className="dateArrowBtn"
            type="button"
            onClick={() => moveDate("prev")}
            disabled={hasToken && dateIndex === 0}
            aria-label="이전 날짜"
          >
            ←
          </button>
          <p className="dateText">{dateLabel}</p>
          <button
            className="dateArrowBtn"
            type="button"
            onClick={() => moveDate("next")}
            disabled={hasToken && weeklyRecommendations.length > 0 && dateIndex === weeklyRecommendations.length - 1}
            aria-label="다음 날짜"
          >
            →
          </button>
        </div>

        <SectionCard title="오늘의 옷 추천">
          <p className="muted">설문을 작성하면 회원 맞춤 추천 결과로 이어집니다.</p>
          <div className="inlineActions">
            <PrimaryButton onClick={goToRecommendationFlow}>오늘의 옷 추천</PrimaryButton>
            {hasToken ? (
              <SecondaryButton
                onClick={() => {
                  clearAccessTokenFromStorage();
                  setHasToken(false);
                  setDateIndex(0);
                }}
              >
                로그아웃
              </SecondaryButton>
            ) : (
              <p className="muted">
                <Link className="textLink" href="/login">
                  로그인
                </Link>{" "}
                /{" "}
                <Link className="textLink" href="/signup">
                  회원가입
                </Link>
              </p>
            )}
          </div>
        </SectionCard>

        <SectionCard title="바로가기">
          <p className="muted">주요 기능으로 빠르게 이동할 수 있습니다.</p>
          <div className="inlineActions">
            <Link className="primaryBtn" href="/ootd">
              OOTD 평가
            </Link>
            <Link className="ghostBtn" href="/closet">
              나의 옷장
            </Link>
            <Link className="ghostBtn" href="/mypage">
              마이페이지
            </Link>
          </div>
        </SectionCard>

        <GenderSelector value={gender} onChange={setGender} />

        {error && <ErrorMessage message={error} />}

        <WeatherCard data={displayedWeather} loading={loadingWeather || loadingWeekly} />
        <RecommendationCard data={displayedRecommendation} loading={loadingRecommendation || loadingWeekly} />
        <ClosetRecommendationCard
          data={closetRecommendation}
          loading={loadingClosetRecommendation}
          hasToken={hasToken}
          error={closetError}
        />
      </section>

      {showMemberOnlyModal && (
        <div className="modalBackdrop" role="dialog" aria-modal="true" aria-label="회원 전용 안내">
          <div className="modalCard">
            <h3>회원 전용 기능입니다.</h3>
            <p className="muted">로그인하면 날짜별 추천을 확인할 수 있습니다.</p>
            <div className="modalActions">
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
    </main>
  );
}
