"use client";

import type { OotdReview } from "@/lib/api/types";
import { EmptyState, LoadingState } from "@/components/ui";

type OotdReviewListProps = {
  reviews: OotdReview[];
  selectedReviewId: number | null;
  loading: boolean;
  onSelect: (id: number) => void;
};

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080";

function normalizeImageUrl(url: string) {
  if (url.startsWith("local://ootd-reviews/")) {
    const filename = url.replace("local://ootd-reviews/", "");
    return `${API_BASE_URL}/uploads/ootd-reviews/${filename}`;
  }
  return url;
}

function canRenderImage(url: string) {
  return /^(https?:\/\/|blob:|data:|\/)/i.test(url);
}

export function OotdReviewList({ reviews, selectedReviewId, loading, onSelect }: OotdReviewListProps) {
  if (loading) {
    return (
      <section className="sectionCard">
        <h2>내 OOTD 리뷰 목록</h2>
        <LoadingState label="리뷰 목록을 불러오는 중입니다..." />
      </section>
    );
  }

  if (reviews.length === 0) {
    return (
      <section className="sectionCard">
        <h2>내 OOTD 리뷰 목록</h2>
        <EmptyState description="아직 업로드한 리뷰가 없습니다." />
      </section>
    );
  }

  return (
    <section className="sectionCard">
      <h2>내 OOTD 리뷰 목록</h2>
      <div className="ootdList">
        {reviews.map((review) => {
          const thumb = review.imageUrls.map(normalizeImageUrl).find(canRenderImage);
          const selected = selectedReviewId === review.id;
          return (
            <button
              key={review.id}
              type="button"
              className={`ootdListItem${selected ? " active" : ""}`}
              onClick={() => onSelect(review.id)}
            >
              <div className="ootdThumb">
                {thumb ? (
                  <img className="ootdThumbImage" src={thumb} alt={`리뷰 ${review.id} 썸네일`} />
                ) : (
                  <span className="muted">이미지</span>
                )}
              </div>
              <div className="ootdListText">
                <strong>{review.reviewDate}</strong>
                <span className="ootdListRating">★ {review.rating.toFixed(1)}</span>
                <span className="ootdListPreview">{review.overallFeedback ?? "피드백 없음"}</span>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}
