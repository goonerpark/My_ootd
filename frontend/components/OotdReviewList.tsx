"use client";

import { ArrowRight } from "lucide-react";
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
      <section className="rounded-3xl border border-surface-container bg-white p-8 soft-shadow">
        <h2 className="mb-6 font-headline-md text-headline-md text-primary">지난 OOTD 리뷰 히스토리</h2>
        <LoadingState label="리뷰 목록을 불러오는 중입니다..." />
      </section>
    );
  }

  if (reviews.length === 0) {
    return (
      <section className="rounded-3xl border border-surface-container bg-white p-8 soft-shadow">
        <h2 className="mb-6 font-headline-md text-headline-md text-primary">지난 OOTD 리뷰 히스토리</h2>
        <EmptyState description="아직 업로드한 리뷰가 없습니다." />
      </section>
    );
  }

  return (
    <section>
      <h2 className="mb-8 font-headline-md text-headline-md text-primary">지난 OOTD 리뷰 히스토리</h2>
      <div className="space-y-4">
        {reviews.map((review) => {
          const thumb = review.imageUrls.map(normalizeImageUrl).find(canRenderImage);
          const selected = selectedReviewId === review.id;
          return (
            <button
              key={review.id}
              type="button"
              className={[
                "flex w-full cursor-pointer items-center gap-4 rounded-2xl border bg-white p-4 text-left soft-shadow transition-colors hover:bg-slate-50",
                selected ? "border-primary" : "border-surface-container-low"
              ].join(" ")}
              onClick={() => onSelect(review.id)}
            >
              <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-xl bg-surface-container-low">
                {thumb ? <img className="h-full w-full object-cover" src={thumb} alt={`리뷰 ${review.id} 썸네일`} /> : <span className="grid h-full place-items-center text-xs text-secondary">이미지</span>}
              </div>
              <div className="min-w-0 flex-grow">
                <div className="flex items-start justify-between gap-3">
                  <h4 className="font-label-sm text-label-sm text-primary">{review.reviewDate}</h4>
                  <span className="font-bold text-amber-400">{review.rating.toFixed(1)}점</span>
                </div>
                <p className="mt-1 truncate text-caption-xs text-secondary">{review.overallFeedback ?? "피드백 없음"}</p>
              </div>
              <ArrowRight className="text-slate-300" size={18} />
            </button>
          );
        })}
      </div>
    </section>
  );
}
