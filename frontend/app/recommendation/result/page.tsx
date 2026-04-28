"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/layout";
import { OutfitCard } from "@/components/stitch/OutfitCard";
import { StyleTag } from "@/components/stitch/StyleTag";
import { RecommendationCard } from "@/components/RecommendationCard";
import { ErrorMessage } from "@/components/ui";
import { fetchTodayMemberRecommendation } from "@/lib/api/client";
import { getAccessTokenFromStorage } from "@/lib/auth/token";
import { mockOutfitCards } from "@/lib/mock/stitch";
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

      <section className="mb-6">
        <h2 className="mb-3 text-lg font-semibold">Explore Similar Vibes</h2>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
          {mockOutfitCards.map((item) => (
            <OutfitCard key={item.id} title={item.title} imageUrl={item.imageUrl} />
          ))}
        </div>
      </section>

      <div className="flex flex-wrap gap-2">
        <Link className="rounded-xl border border-zinc-300 px-4 py-2 text-sm font-semibold text-zinc-700" href="/survey">설문 다시 작성</Link>
        <Link className="rounded-xl bg-zinc-900 px-4 py-2 text-sm font-semibold text-white" href="/">메인으로 이동</Link>
      </div>
    </AppShell>
  );
}
