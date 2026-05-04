"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import useSWR from "swr";
import { AppShell } from "@/components/layout";
import {
  ApiRequestError,
  createOotdReview,
  fetchOotdClosetSuggestions,
  fetchOotdReviewDetail,
  fetchOotdReviews
} from "@/lib/api/client";
import { getAccessTokenFromStorage } from "@/lib/auth/token";
import type { OotdReview } from "@/lib/api/types";
import { OotdUploadForm } from "@/components/OotdUploadForm";
import { ErrorMessage } from "@/components/ui";

const OotdReviewList = dynamic(() => import("@/components/OotdReviewList").then((mod) => mod.OotdReviewList), {
  ssr: false,
  loading: () => <SectionSkeleton label="리뷰 목록을 준비하고 있어요" />
});

const OotdReviewResultCard = dynamic(() => import("@/components/OotdReviewResultCard").then((mod) => mod.OotdReviewResultCard), {
  ssr: false,
  loading: () => <SectionSkeleton label="리뷰 상세를 준비하고 있어요" />
});

const OotdClosetSuggestionSection = dynamic(() => import("@/components/OotdClosetSuggestionSection").then((mod) => mod.OotdClosetSuggestionSection), {
  ssr: false,
  loading: () => <SectionSkeleton label="옷장 대체 추천을 준비하고 있어요" />
});

function toKoreanErrorMessage(message: string) {
  if (message === "Authentication is required") return "로그인이 필요한 기능입니다.";
  if (message === "Unexpected server error") return "서버에서 예기치 못한 오류가 발생했습니다.";
  return message;
}

function formatDateInput(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function SectionSkeleton({ label }: { label: string }) {
  return (
    <section className="rounded-3xl border border-surface-container bg-white p-6 shadow-soft" aria-label={label}>
      <div className="mb-4 h-5 w-44 animate-pulse rounded-full bg-surface-container" />
      <div className="grid gap-3 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="h-28 animate-pulse rounded-2xl bg-surface-container-low" />
        ))}
      </div>
    </section>
  );
}

export default function OotdPage() {
  const [token, setToken] = useState<string | null>(null);
  const [reviewDate, setReviewDate] = useState(formatDateInput(new Date()));
  const [notes, setNotes] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [selectedReviewId, setSelectedReviewId] = useState<number | null>(null);
  const [lastUploadedReview, setLastUploadedReview] = useState<OotdReview | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    setToken(getAccessTokenFromStorage());
  }, []);

  const {
    data: reviews = [],
    error: reviewsError,
    isLoading: loadingList,
    mutate: refreshReviews
  } = useSWR<OotdReview[]>(
    token ? ["ootd-reviews", token] : null,
    ([, authToken]) => fetchOotdReviews(authToken as string),
    {
      keepPreviousData: true,
      revalidateOnFocus: false,
      dedupingInterval: 10_000
    }
  );

  useEffect(() => {
    if (!reviewsError) return;
    const message = reviewsError instanceof Error ? toKoreanErrorMessage(reviewsError.message) : "리뷰 목록 조회에 실패했습니다.";
    setError(message);
  }, [reviewsError]);

  useEffect(() => {
    if (selectedReviewId == null && reviews.length > 0) {
      setSelectedReviewId(reviews[0].id);
    }
  }, [reviews, selectedReviewId]);

  const activeReviewId = selectedReviewId ?? reviews[0]?.id ?? null;

  const {
    data: selectedReview = null,
    error: detailError,
    isLoading: loadingDetail
  } = useSWR(
    token && activeReviewId ? ["ootd-review-detail", token, activeReviewId] : null,
    ([, authToken, reviewId]) => fetchOotdReviewDetail(authToken as string, Number(reviewId)),
    {
      keepPreviousData: true,
      revalidateOnFocus: false,
      dedupingInterval: 10_000
    }
  );

  const {
    data: closetSuggestions = null,
    error: closetSuggestionErrorRaw,
    isLoading: loadingClosetSuggestions
  } = useSWR(
    token && activeReviewId ? ["ootd-closet-suggestions", token, activeReviewId] : null,
    ([, authToken, reviewId]) => fetchOotdClosetSuggestions(authToken as string, Number(reviewId)),
    {
      keepPreviousData: true,
      revalidateOnFocus: false,
      dedupingInterval: 10_000
    }
  );

  useEffect(() => {
    if (!detailError) return;
    const message = detailError instanceof Error ? toKoreanErrorMessage(detailError.message) : "리뷰 상세 조회에 실패했습니다.";
    setError(message);
  }, [detailError]);

  const closetSuggestionError = useMemo(() => {
    if (!closetSuggestionErrorRaw) return null;
    return closetSuggestionErrorRaw instanceof Error ? toKoreanErrorMessage(closetSuggestionErrorRaw.message) : "대체 추천 조회에 실패했습니다.";
  }, [closetSuggestionErrorRaw]);

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
      setSelectedReviewId(created.id);
      await refreshReviews();
    } catch (err) {
      const message =
        err instanceof ApiRequestError || err instanceof Error ? toKoreanErrorMessage(err.message) : "업로드에 실패했습니다.";
      setError(message);
    } finally {
      setUploading(false);
    }
  };

  const detailCardTitle = loadingDetail ? "OOTD 리뷰 상세 (불러오는 중)" : "OOTD 리뷰 상세";

  if (!token) {
    return (
      <AppShell activePath="/ootd">
        <section className="rounded-3xl border border-surface-container bg-white p-8 shadow-soft">
          <h1 className="font-headline-md text-headline-md">OOTD AI 평가</h1>
          <p className="mt-2 text-secondary">로그인이 필요한 기능입니다. 로그인 후 OOTD 업로드와 리뷰 조회를 이용할 수 있어요.</p>
          <div className="mt-5 flex gap-2">
            <Link className="rounded-full bg-primary px-5 py-2 text-sm font-bold text-white" href="/login">로그인</Link>
            <Link className="rounded-full border border-outline-variant bg-white px-5 py-2 text-sm font-bold text-primary" href="/signup">회원가입</Link>
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
          <Link className="mt-3 inline-flex text-sm font-bold text-primary underline" href="/">메인으로 이동</Link>
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
        <OotdReviewList reviews={reviews} selectedReviewId={activeReviewId} loading={loadingList} onSelect={setSelectedReviewId} />
        <OotdReviewResultCard title={detailCardTitle} review={selectedReview} />
        <OotdClosetSuggestionSection data={closetSuggestions} loading={loadingClosetSuggestions} error={closetSuggestionError} />
      </div>
    </AppShell>
  );
}
