"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/layout";
import { SurveyWizardForm } from "@/components/SurveyWizardForm";
import { ApiRequestError, fetchTodaySurvey, upsertTodaySurvey } from "@/lib/api/client";
import { getAccessTokenFromStorage } from "@/lib/auth/token";
import { buildLatestFeedbackSurveyNote } from "@/lib/recommendation/feedback";
import { saveSurveyState } from "@/lib/survey/storage";
import { DEFAULT_SURVEY_FORM_STATE, type SurveyFormState } from "@/lib/survey/types";
import { ErrorMessage, LoadingState } from "@/components/ui";

function toKoreanErrorMessage(message: string) {
  if (message === "Authentication is required") {
    return "로그인이 필요한 기능입니다.";
  }
  if (message === "Unexpected server error") {
    return "서버에서 예기치 못한 오류가 발생했습니다.";
  }
  return message;
}

function appendFeedbackNote(notes: string, feedbackNote: string) {
  if (!feedbackNote || notes.includes("[추천 피드백]")) return notes;
  const trimmedNotes = notes.trim();
  const nextNotes = trimmedNotes.length > 0 ? `${trimmedNotes}\n${feedbackNote}` : feedbackNote;
  return nextNotes.slice(0, 255);
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
        const feedbackNote = buildLatestFeedbackSurveyNote();
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
            notes: appendFeedbackNote(survey.notes ?? "", feedbackNote)
          }));
        } else if (feedbackNote) {
          setInitialForm((prev) => ({
            ...prev,
            notes: appendFeedbackNote(prev.notes, feedbackNote)
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
      <AppShell activePath="/survey">
        <section className="mx-auto max-w-3xl rounded-3xl border border-surface-container bg-white p-8 text-center shadow-soft">
          <h1 className="font-headline-md text-headline-md">오늘의 스타일 찾기</h1>
          <p className="mt-2 text-secondary">로그인이 필요한 기능입니다. 로그인 후 설문을 작성해 주세요.</p>
          <p className="mt-5 text-sm">
            <Link className="font-bold text-primary underline" href="/login">
                로그인
            </Link>{" "}
            /{" "}
            <Link className="font-bold text-primary underline" href="/signup">
                회원가입
            </Link>
          </p>
        </section>
      </AppShell>
    );
  }

  return (
    <AppShell activePath="/survey">
      <section className="mx-auto max-w-3xl">
        <div className="mb-10 text-center">
          <h1 className="font-display-lg text-display-lg text-primary">오늘의 스타일 찾기</h1>
          <p className="mt-2 font-body-md text-body-md text-secondary">몇 가지 질문을 통해 완벽한 AI 코디를 추천해 드립니다.</p>
          <Link className="mt-3 inline-flex text-sm font-bold text-primary underline" href="/">
            메인으로 이동
          </Link>
        </div>

        {loadingInit ? <LoadingState label="설문 초기값을 불러오는 중입니다..." /> : <SurveyWizardForm initialValue={initialForm} loading={submitting} onSubmit={submitSurvey} />}

        {error && <ErrorMessage message={error} />}
      </section>
    </AppShell>
  );
}
