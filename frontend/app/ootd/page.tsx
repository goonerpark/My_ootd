"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/layout";
import {
  ApiRequestError,
  createOotdReview,
  fetchOotdClosetSuggestions,
  fetchOotdReviewDetail,
  fetchOotdReviews
} from "@/lib/api/client";
import { getAccessTokenFromStorage } from "@/lib/auth/token";
import type { OotdClosetSuggestionsResult, OotdReview } from "@/lib/api/types";
import { OotdReviewList } from "@/components/OotdReviewList";
import { OotdReviewResultCard } from "@/components/OotdReviewResultCard";
import { OotdClosetSuggestionSection } from "@/components/OotdClosetSuggestionSection";
import { OotdUploadForm } from "@/components/OotdUploadForm";
import { ErrorMessage } from "@/components/ui";

function toKoreanErrorMessage(message: string) {
  if (message === "Authentication is required") {
    return "로그인이 필요한 기능입니다.";
  }
  if (message === "Unexpected server error") {
    return "서버에서 예기치 못한 오류가 발생했습니다.";
  }
  return message;
}

function formatDateInput(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export default function OotdPage() {
  const [token, setToken] = useState<string | null>(null);
  const [reviewDate, setReviewDate] = useState(formatDateInput(new Date()));
  const [notes, setNotes] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  const [reviews, setReviews] = useState<OotdReview[]>([]);
  const [selectedReviewId, setSelectedReviewId] = useState<number | null>(null);
  const [selectedReview, setSelectedReview] = useState<OotdReview | null>(null);
  const [lastUploadedReview, setLastUploadedReview] = useState<OotdReview | null>(null);
  const [closetSuggestions, setClosetSuggestions] = useState<OotdClosetSuggestionsResult | null>(null);

  const [loadingList, setLoadingList] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [loadingClosetSuggestions, setLoadingClosetSuggestions] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [closetSuggestionError, setClosetSuggestionError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    setToken(getAccessTokenFromStorage());
  }, []);

  const loadReviews = async (authToken: string) => {
    setLoadingList(true);
    try {
      const data = await fetchOotdReviews(authToken);
      setReviews(data);
      if (data.length > 0 && selectedReviewId == null) {
        setSelectedReviewId(data[0].id);
      }
    } finally {
      setLoadingList(false);
    }
  };

  useEffect(() => {
    if (!token) {
      return;
    }

    const initialize = async () => {
      setError(null);
      try {
        await loadReviews(token);
      } catch (err) {
        const message = err instanceof Error ? toKoreanErrorMessage(err.message) : "리뷰 목록 조회에 실패했습니다.";
        setError(message);
      }
    };

    initialize();
  }, [token]);

  useEffect(() => {
    if (!token || selectedReviewId == null) {
      setSelectedReview(null);
      setClosetSuggestions(null);
      setClosetSuggestionError(null);
      return;
    }

    const loadDetail = async () => {
      setLoadingDetail(true);
      try {
        const detail = await fetchOotdReviewDetail(token, selectedReviewId);
        setSelectedReview(detail);
      } catch (err) {
        const message = err instanceof Error ? toKoreanErrorMessage(err.message) : "리뷰 상세 조회에 실패했습니다.";
        setError(message);
      } finally {
        setLoadingDetail(false);
      }
    };

    loadDetail();
  }, [selectedReviewId, token]);

  useEffect(() => {
    if (!token || selectedReviewId == null) {
      setClosetSuggestions(null);
      setClosetSuggestionError(null);
      return;
    }

    const loadClosetSuggestions = async () => {
      setLoadingClosetSuggestions(true);
      setClosetSuggestionError(null);
      try {
        const data = await fetchOotdClosetSuggestions(token, selectedReviewId);
        setClosetSuggestions(data);
      } catch (err) {
        const message = err instanceof Error ? toKoreanErrorMessage(err.message) : "대체 추천 조회에 실패했습니다.";
        setClosetSuggestionError(message);
      } finally {
        setLoadingClosetSuggestions(false);
      }
    };

    loadClosetSuggestions();
  }, [selectedReviewId, token]);

  const submitUpload = async () => {
    if (!token) {
      setError("로그인이 필요한 기능입니다.");
      return;
    }
    if (selectedFiles.length === 0) {
      setError("이미지 파일을 1개 이상 선택해 주세요.");
      return;
    }

    setUploading(true);
    setError(null);
    setSuccess(null);
    try {
      const created = await createOotdReview(token, {
        reviewDate,
        notes,
        images: selectedFiles
      });
      setLastUploadedReview(created);
      setSuccess("업로드와 평가 저장이 완료되었습니다.");
      setSelectedFiles([]);
      setNotes("");
      await loadReviews(token);
      setSelectedReviewId(created.id);
    } catch (err) {
      const message =
        err instanceof ApiRequestError || err instanceof Error ? toKoreanErrorMessage(err.message) : "업로드에 실패했습니다.";
      setError(message);
    } finally {
      setUploading(false);
    }
  };

  const detailCardTitle = useMemo(() => {
    if (loadingDetail) {
      return "OOTD 리뷰 상세 (불러오는 중)";
    }
    return "OOTD 리뷰 상세";
  }, [loadingDetail]);

  if (!token) {
    return (
      <AppShell activePath="/ootd">
        <section className="rounded-3xl border border-surface-container bg-white p-8 shadow-soft">
          <h1 className="font-headline-md text-headline-md">OOTD AI 평가</h1>
          <p className="mt-2 text-secondary">로그인이 필요한 기능입니다. 로그인 후 OOTD 업로드와 리뷰 조회를 이용할 수 있어요.</p>
          <div className="mt-5 flex gap-2">
            <Link className="rounded-full bg-primary px-5 py-2 text-sm font-bold text-white" href="/login">
                로그인
            </Link>
            <Link className="rounded-full border border-outline-variant bg-white px-5 py-2 text-sm font-bold text-primary" href="/signup">
                회원가입
            </Link>
          </div>
        </section>
      </AppShell>
    );
  }

  return (
    <AppShell activePath="/ootd">
      <div className="space-y-12">
        <section>
          <h1 className="font-display-lg text-display-lg text-primary">OOTD AI 평가</h1>
          <p className="mt-2 text-body-lg text-secondary">업로드한 사진 기준으로 별점과 피드백을 확인하세요.</p>
          <Link className="mt-3 inline-flex text-sm font-bold text-primary underline" href="/">
            메인으로 이동
          </Link>
        </section>

        <OotdUploadForm
          reviewDate={reviewDate}
          notes={notes}
          files={selectedFiles}
          loading={uploading}
          onChangeDate={setReviewDate}
          onChangeNotes={setNotes}
          onChangeFiles={setSelectedFiles}
          onSubmit={submitUpload}
        />

        {success && <p className="success">{success}</p>}
        {error && <ErrorMessage message={error} />}

        <OotdReviewResultCard title="방금 업로드한 평가 결과" review={lastUploadedReview} />

        <OotdReviewList reviews={reviews} selectedReviewId={selectedReviewId} loading={loadingList} onSelect={setSelectedReviewId} />

        <OotdReviewResultCard title={detailCardTitle} review={selectedReview} />
        <OotdClosetSuggestionSection data={closetSuggestions} loading={loadingClosetSuggestions} error={closetSuggestionError} />
      </div>
    </AppShell>
  );
}
