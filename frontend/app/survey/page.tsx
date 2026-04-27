"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { SurveyWizardForm } from "@/components/SurveyWizardForm";
import { ApiRequestError, fetchTodaySurvey, upsertTodaySurvey } from "@/lib/api/client";
import { getAccessTokenFromStorage } from "@/lib/auth/token";
import { saveSurveyState } from "@/lib/survey/storage";
import { DEFAULT_SURVEY_FORM_STATE, type SurveyFormState } from "@/lib/survey/types";
import { ErrorMessage, LoadingState, PageHeader, SectionCard } from "@/components/ui";

function toKoreanErrorMessage(message: string) {
  if (message === "Authentication is required") {
    return "로그인이 필요한 기능입니다.";
  }
  if (message === "Unexpected server error") {
    return "서버에서 예기치 못한 오류가 발생했습니다.";
  }
  return message;
}

export default function SurveyPage() {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [initialForm, setInitialForm] = useState<SurveyFormState>(DEFAULT_SURVEY_FORM_STATE);
  const [loadingInit, setLoadingInit] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const localToken = getAccessTokenFromStorage();
    setToken(localToken);

    if (!localToken) {
      setLoadingInit(false);
      return;
    }

    const initialize = async () => {
      setLoadingInit(true);
      setError(null);
      try {
        const survey = await fetchTodaySurvey(localToken).catch((err) => {
          if (err instanceof ApiRequestError && err.status === 404) {
            return null;
          }
          throw err;
        });

        if (survey) {
          setInitialForm((prev) => ({
            ...prev,
            outingPurpose: survey.outingPurpose,
            notes: survey.notes ?? ""
          }));
        }
      } catch (err) {
        const message = err instanceof Error ? toKoreanErrorMessage(err.message) : "설문 초기값을 불러오지 못했습니다.";
        setError(message);
      } finally {
        setLoadingInit(false);
      }
    };

    initialize();
  }, []);

  const submitSurvey = async (formState: SurveyFormState) => {
    if (!token) {
      setError("로그인이 필요한 기능입니다.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      await upsertTodaySurvey(token, {
        outingPurpose: formState.outingPurpose,
        notes: formState.notes.trim().length > 0 ? formState.notes.trim() : undefined
      });

      saveSurveyState(formState);
      router.push("/recommendation/loading");
    } catch (err) {
      const message = err instanceof Error ? toKoreanErrorMessage(err.message) : "설문 저장에 실패했습니다.";
      setError(message);
      setSubmitting(false);
    }
  };

  if (!token) {
    return (
      <main className="page">
        <section className="container">
          <PageHeader title="설문 페이지" subtitle="회원 전용 기능" />
          <SectionCard>
            <p className="muted">로그인이 필요한 기능입니다. 로그인 후 설문을 작성해 주세요.</p>
            <p className="muted">
              <Link className="textLink" href="/login">
                로그인
              </Link>{" "}
              /{" "}
              <Link className="textLink" href="/signup">
                회원가입
              </Link>
            </p>
          </SectionCard>
        </section>
      </main>
    );
  }

  return (
    <main className="page">
      <section className="container">
        <PageHeader title="오늘 추천 설문" subtitle="간단한 질문 5개에 답하면 추천 정확도가 높아집니다." />

        <p className="muted">
          <Link className="textLink" href="/">
            메인으로 이동
          </Link>
        </p>

        {loadingInit ? <LoadingState label="설문 초기값을 불러오는 중입니다..." /> : <SurveyWizardForm initialValue={initialForm} loading={submitting} onSubmit={submitSurvey} />}

        {error && <ErrorMessage message={error} />}
      </section>
    </main>
  );
}
