"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { fetchTodayMemberRecommendation } from "@/lib/api/client";
import { getAccessTokenFromStorage } from "@/lib/auth/token";
import { saveRecommendationError, saveRecommendationResult } from "@/lib/survey/storage";

function toKoreanErrorMessage(message: string) {
  if (message === "Authentication is required") {
    return "로그인이 필요한 기능입니다.";
  }
  if (message === "Unexpected server error") {
    return "서버에서 예기치 못한 오류가 발생했습니다.";
  }
  return message;
}

export default function RecommendationLoadingPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = getAccessTokenFromStorage();
    if (!token) {
      router.replace("/login");
      return;
    }

    let cancelled = false;

    const run = async () => {
      try {
        const result = await fetchTodayMemberRecommendation(token);
        if (cancelled) {
          return;
        }
        saveRecommendationResult(result);
      } catch (err) {
        if (cancelled) {
          return;
        }
        const message = err instanceof Error ? toKoreanErrorMessage(err.message) : "추천 결과를 불러오지 못했습니다.";
        setError(message);
        saveRecommendationError(message);
      } finally {
        if (!cancelled) {
          window.setTimeout(() => {
            router.replace("/recommendation/result");
          }, 150);
        }
      }
    };

    run();

    return () => {
      cancelled = true;
    };
  }, [router]);

  return (
    <main className="page">
      <section className="container">
        <section className="sectionCard loadingPanel">
          <div className="spinner" />
          <h2>오늘의 옷차림을 분석하고 있어요</h2>
          <p className="muted">날씨와 설문 답변을 반영해 추천을 준비 중입니다.</p>
          {error && <p className="error">{error}</p>}
        </section>
      </section>
    </main>
  );
}
