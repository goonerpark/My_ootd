"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { RecommendationCard } from "@/components/RecommendationCard";
import { fetchTodayMemberRecommendation } from "@/lib/api/client";
import { getAccessTokenFromStorage } from "@/lib/auth/token";
import { buildRecommendationPrompt } from "@/lib/survey/prompt";
import { getRecommendationError, getSavedRecommendationResult, getSavedSurveyState } from "@/lib/survey/storage";
import { DEFAULT_SURVEY_FORM_STATE } from "@/lib/survey/types";
import type { TodayRecommendation } from "@/lib/api/types";

function toKoreanErrorMessage(message: string) {
  if (message === "Authentication is required") {
    return "로그인이 필요한 기능입니다.";
  }
  return message;
}

export default function RecommendationResultPage() {
  const [recommendation, setRecommendation] = useState<TodayRecommendation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const promptPreview = useMemo(() => {
    const state = getSavedSurveyState() ?? DEFAULT_SURVEY_FORM_STATE;
    return buildRecommendationPrompt(state);
  }, []);

  useEffect(() => {
    const cachedResult = getSavedRecommendationResult();
    const cachedError = getRecommendationError();

    if (cachedResult) {
      setRecommendation(cachedResult);
      setError(cachedError);
      setLoading(false);
      return;
    }

    const token = getAccessTokenFromStorage();
    if (!token) {
      setError("로그인이 필요한 기능입니다.");
      setLoading(false);
      return;
    }

    const load = async () => {
      setLoading(true);
      try {
        const result = await fetchTodayMemberRecommendation(token);
        setRecommendation(result);
      } catch (err) {
        const message = err instanceof Error ? toKoreanErrorMessage(err.message) : "추천 결과를 불러오지 못했습니다.";
        setError(message);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  return (
    <main className="page">
      <section className="container">
        <header className="header">
          <h1>오늘의 옷 추천 결과</h1>
          <p>설문 응답을 반영한 추천입니다.</p>
        </header>

        <section className="panel">
          <h2>AI 프롬프트 변환 미리보기</h2>
          <p className="muted">{promptPreview}</p>
        </section>

        {error && <p className="error">{error}</p>}

        <RecommendationCard data={recommendation} loading={loading} />

        <section className="panel inlineActions">
          <Link className="textLink" href="/survey">설문 다시 작성</Link>
          <Link className="textLink" href="/">메인으로 이동</Link>
        </section>
      </section>
    </main>
  );
}
