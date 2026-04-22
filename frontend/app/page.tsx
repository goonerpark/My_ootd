"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { GenderSelector } from "@/components/GenderSelector";
import { RecommendationCard } from "@/components/RecommendationCard";
import { WeatherCard } from "@/components/WeatherCard";
import { fetchTodayRecommendation, fetchTodayWeather } from "@/lib/api/client";
import { clearAccessTokenFromStorage, getAccessTokenFromStorage } from "@/lib/auth/token";
import type { Gender, TodayRecommendation, TodayWeather } from "@/lib/api/types";

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
  const [loadingWeather, setLoadingWeather] = useState(false);
  const [loadingRecommendation, setLoadingRecommendation] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  return (
    <main className="page">
      <section className="container">
        <header className="header">
          <h1>OOTD 데일리 MVP</h1>
          <p>{todayLabel}</p>
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

        <WeatherCard data={weather} loading={loadingWeather} />
        <RecommendationCard data={recommendation} loading={loadingRecommendation} />
      </section>
    </main>
  );
}
