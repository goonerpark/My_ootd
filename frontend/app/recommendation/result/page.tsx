"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/layout";
import { StyleTag } from "@/components/stitch/StyleTag";
import { RecommendationCard } from "@/components/RecommendationCard";
import { RecommendationFeedbackPanel } from "@/components/RecommendationFeedbackPanel";
import { ErrorMessage } from "@/components/ui";
import { fetchTodayMemberRecommendation } from "@/lib/api/client";
import { getAccessTokenFromStorage } from "@/lib/auth/token";
import {
  getLatestRecommendationFeedback,
  saveRecommendationFeedback,
  type RecommendationFeedbackValue
} from "@/lib/recommendation/feedback";
import { buildRecommendationPrompt } from "@/lib/survey/prompt";
import { getRecommendationError, getSavedRecommendationResult, getSavedSurveyState } from "@/lib/survey/storage";
import { DEFAULT_SURVEY_FORM_STATE } from "@/lib/survey/types";
import type { TodayRecommendation } from "@/lib/api/types";

function toKoreanErrorMessage(message: string) {
  if (message === "Authentication is required") return "로그인이 필요한 기능입니다.";
  return message;
}

export default function RecommendationResultPage() {
  const [recommendation, setRecommendation] = useState<TodayRecommendation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedFeedback, setSelectedFeedback] = useState<RecommendationFeedbackValue | null>(null);
  const [promptPreview, setPromptPreview] = useState(() => buildRecommendationPrompt(DEFAULT_SURVEY_FORM_STATE));

  useEffect(() => {
    const state = getSavedSurveyState() ?? DEFAULT_SURVEY_FORM_STATE;
    setPromptPreview(buildRecommendationPrompt(state));
    setSelectedFeedback(getLatestRecommendationFeedback()?.value ?? null);

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
        setRecommendation(await fetchTodayMemberRecommendation(token));
      } catch (err) {
        const message = err instanceof Error ? toKoreanErrorMessage(err.message) : "추천 결과를 불러오지 못했습니다.";
        setError(message);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const saveFeedback = (value: RecommendationFeedbackValue) => {
    setSelectedFeedback(value);
    saveRecommendationFeedback(value, {
      recommendationId: recommendation?.recommendationId ?? null,
      targetDate: recommendation?.targetDate ?? null,
      source: "result"
    });
  };

  return (
    <AppShell activePath="/recommendation/result">
      <section className="mb-6">
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-900">Outfit Recommendation</h1>
        <p className="mt-1 text-sm text-zinc-500">설문 답변을 반영한 회원 맞춤 추천입니다.</p>
      </section>

      <section className="mb-6 rounded-2xl border border-zinc-200 bg-white p-5 shadow-soft">
        <h2 className="mb-3 text-lg font-semibold">추천 컨텍스트</h2>
        <div className="mb-3 flex flex-wrap gap-2">
          <StyleTag>Weather Aware</StyleTag>
          <StyleTag>Survey Driven</StyleTag>
          <StyleTag>Member Mode</StyleTag>
        </div>
        <p className="text-sm text-zinc-600">{promptPreview}</p>
      </section>

      {error && <ErrorMessage message={error} />}

      <div className="mb-6 rounded-2xl border border-zinc-200 bg-white p-5 shadow-soft">
        <RecommendationCard data={recommendation} loading={loading} />
      </div>

      {!loading && recommendation && (
        <div className="mb-6">
          <RecommendationFeedbackPanel selected={selectedFeedback} onSelect={saveFeedback} />
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <Link className="rounded-xl border border-zinc-300 px-4 py-2 text-sm font-semibold text-zinc-700" href="/survey">설문 다시 작성</Link>
        <Link className="rounded-xl bg-zinc-900 px-4 py-2 text-sm font-semibold text-white" href="/">메인으로 이동</Link>
      </div>
    </AppShell>
  );
}
