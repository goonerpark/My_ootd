"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ApiRequestError, createOotdReview, fetchOotdReviewDetail, fetchOotdReviews } from "@/lib/api/client";
import { getAccessTokenFromStorage } from "@/lib/auth/token";
import type { OotdReview } from "@/lib/api/types";
import { OotdReviewList } from "@/components/OotdReviewList";
import { OotdReviewResultCard } from "@/components/OotdReviewResultCard";
import { OotdUploadForm } from "@/components/OotdUploadForm";

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

  const [loadingList, setLoadingList] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
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
        err instanceof ApiRequestError || err instanceof Error
          ? toKoreanErrorMessage(err.message)
          : "업로드에 실패했습니다.";
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
      <main className="page">
        <section className="container">
          <header className="header">
            <h1>OOTD 리뷰</h1>
            <p>회원 전용 기능</p>
          </header>
          <section className="panel">
            <p className="muted">로그인이 필요한 기능입니다. 로그인 후 OOTD 업로드와 리뷰 조회를 이용할 수 있어요.</p>
            <div className="inlineActions">
              <Link className="primaryBtn" href="/login">
                로그인
              </Link>
              <Link className="ghostBtn" href="/signup">
                회원가입
              </Link>
            </div>
          </section>
        </section>
      </main>
    );
  }

  return (
    <main className="page">
      <section className="container">
        <header className="header">
          <h1>OOTD 리뷰</h1>
          <p>업로드한 사진을 기준으로 별점과 핏/색 조합/종합 피드백을 확인하세요.</p>
        </header>

        <p className="muted">
          <Link className="textLink" href="/">
            메인으로 이동
          </Link>
        </p>

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
        {error && <p className="error">{error}</p>}

        <OotdReviewResultCard title="방금 업로드한 평가 결과" review={lastUploadedReview} />

        <OotdReviewList
          reviews={reviews}
          selectedReviewId={selectedReviewId}
          loading={loadingList}
          onSelect={setSelectedReviewId}
        />

        <OotdReviewResultCard title={detailCardTitle} review={selectedReview} />
      </section>
    </main>
  );
}
