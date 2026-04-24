"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { GenderSelector } from "@/components/GenderSelector";
import { RecommendationCard } from "@/components/RecommendationCard";
import { WeatherCard } from "@/components/WeatherCard";
import { fetchTodayRecommendation, fetchTodayWeather, fetchWeeklyRecommendations } from "@/lib/api/client";
import { clearAccessTokenFromStorage, getAccessTokenFromStorage } from "@/lib/auth/token";
import type {
  Gender,
  TodayRecommendation,
  TodayWeather,
  WeeklyRecommendationItem
} from "@/lib/api/types";

function toKoreanErrorMessage(message: string) {
  if (message === "Unexpected server error") {
    return "서버에서 예기치 않은 오류가 발생했습니다.";
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
  const [weeklyRecommendations, setWeeklyRecommendations] = useState<WeeklyRecommendationItem[]>([]);
  const [dateIndex, setDateIndex] = useState(0);
  const [loadingWeather, setLoadingWeather] = useState(false);
  const [loadingRecommendation, setLoadingRecommendation] = useState(false);
  const [loadingWeekly, setLoadingWeekly] = useState(false);
  const [error, setError] = useState<string | null>(null);
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
        <header className="header">
          <h1>OOTD 데일리 MVP</h1>
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
        </header>

        <section className="panel">
          <h2>오늘의 옷 추천</h2>
          <p className="muted">설문을 작성하면 회원 맞춤 추천 결과로 이어집니다.</p>
          <div className="inlineActions">
            <button className="primaryBtn" type="button" onClick={goToRecommendationFlow}>
              오늘의 옷 추천
            </button>
            {hasToken ? (
                <button
                  className="ghostBtn"
                  type="button"
                  onClick={() => {
                    clearAccessTokenFromStorage();
                    setHasToken(false);
                    setDateIndex(0);
                  }}
                >
                  로그아웃
                </button>
            ) : (
              <p className="muted">
                <Link className="textLink" href="/login">로그인</Link> /{" "}
                <Link className="textLink" href="/signup">회원가입</Link>
              </p>
            )}
          </div>
        </section>

        <GenderSelector value={gender} onChange={setGender} />

        {error && <p className="error">{error}</p>}

        <WeatherCard data={displayedWeather} loading={loadingWeather || loadingWeekly} />
        <RecommendationCard data={displayedRecommendation} loading={loadingRecommendation || loadingWeekly} />
      </section>

      {showMemberOnlyModal && (
        <div className="modalBackdrop" role="dialog" aria-modal="true" aria-label="회원 전용 안내">
          <div className="modalCard">
            <h3>회원 전용 기능입니다.</h3>
            <p className="muted">로그인 또는 회원가입 후 날짜별 추천을 이용할 수 있어요.</p>
            <div className="modalActions">
              <button
                className="primaryBtn"
                type="button"
                onClick={() => {
                  setShowMemberOnlyModal(false);
                  router.push("/login");
                }}
              >
                로그인
              </button>
              <button
                className="ghostBtn"
                type="button"
                onClick={() => {
                  setShowMemberOnlyModal(false);
                  router.push("/signup");
                }}
              >
                회원가입
              </button>
              <button className="ghostBtn" type="button" onClick={() => setShowMemberOnlyModal(false)}>
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
