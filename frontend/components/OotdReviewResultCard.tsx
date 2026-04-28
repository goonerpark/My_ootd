"use client";

import { CalendarDays, CheckCircle2, Palette, Ruler, Star } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { OotdReview } from "@/lib/api/types";
import { EmptyState } from "@/components/ui";

type OotdReviewResultCardProps = {
  title: string;
  review: OotdReview | null;
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

function starValue(rating: number) {
  return rating > 5 ? Math.round(rating / 20) : Math.round(rating);
}

function ratingLabel(rating: number) {
  return rating > 5 ? `${Math.round(rating)} / 100` : `${rating.toFixed(1)} / 5`;
}

function formatDateTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  }).format(date);
}

function FeedbackCard({
  title,
  body,
  icon: Icon
}: {
  title: string;
  body: string | null;
  icon: LucideIcon;
}) {
  return (
    <article className="rounded-3xl border border-surface-container bg-white p-6 soft-shadow">
      <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/5">
        <Icon className="text-primary" size={22} />
      </div>
      <h3 className="mb-3 font-title-sm text-title-sm">{title}</h3>
      <p className="text-body-md text-secondary">{body || "분석 내용이 없습니다."}</p>
    </article>
  );
}

export function OotdReviewResultCard({ title, review }: OotdReviewResultCardProps) {
  if (!review) {
    return (
      <section className="rounded-3xl border border-surface-container bg-white p-8 soft-shadow">
        <h2 className="mb-4 font-headline-md text-headline-md text-primary">{title}</h2>
        <EmptyState description="표시할 평가 결과가 없습니다." />
      </section>
    );
  }

  const mappedImageUrls = review.imageUrls.map(normalizeImageUrl);
  const displayImage = mappedImageUrls.find(canRenderImage);
  const filledStars = Math.max(0, Math.min(5, starValue(review.rating)));

  return (
    <section className="space-y-8">
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <div className="rounded-3xl border border-surface-container bg-white p-8 soft-shadow">
          <div className="relative aspect-[3/4] overflow-hidden rounded-2xl bg-surface-container-low">
            {displayImage ? (
              <img className="h-full w-full object-cover" src={displayImage} alt="업로드한 OOTD 이미지" />
            ) : (
              <div className="grid h-full place-items-center text-secondary">이미지를 표시할 수 없습니다.</div>
            )}
          </div>
          {!displayImage && mappedImageUrls.length > 0 && <p className="mt-3 break-all text-caption-xs text-secondary">저장 URL: {mappedImageUrls[0]}</p>}
        </div>

        <div className="flex flex-col justify-center space-y-6">
          <div>
            <h2 className="font-display-lg text-primary">{title}</h2>
            <p className="text-body-lg text-secondary">AI가 분석한 당신의 오늘의 코디 점수입니다.</p>
          </div>
          <div className="flex flex-col items-center rounded-3xl border border-surface-container bg-white p-8 soft-shadow">
            <div className="mb-4 flex gap-1">
              {Array.from({ length: 5 }).map((_, index) => (
                <Star
                  key={index}
                  className={index < filledStars ? "fill-amber-400 text-amber-400" : "text-slate-200"}
                  size={38}
                />
              ))}
            </div>
            <div className="font-display-lg text-display-lg font-black text-primary">{ratingLabel(review.rating)}</div>
            <div className="mt-4 rounded-full bg-secondary-container px-4 py-2 font-label-sm text-label-sm text-on-secondary-container">
              {review.overallFeedback ? "AI 평가 완료" : "평가 결과"}
            </div>
            <div className="mt-5 grid w-full gap-2 text-sm text-secondary">
              <p className="flex items-center gap-2">
                <CalendarDays size={16} />
                리뷰 날짜: {review.reviewDate}
              </p>
              <p>생성 시각: {formatDateTime(review.createdAt)}</p>
              <p>모델 버전: {review.aiModelVersion ?? "없음"}</p>
            </div>
          </div>
        </div>
      </div>

      <section className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <FeedbackCard title="핏 분석" body={review.fitFeedback} icon={Ruler} />
        <FeedbackCard title="컬러 조합" body={review.colorFeedback} icon={Palette} />
        <FeedbackCard title="종합 의견" body={review.overallFeedback} icon={CheckCircle2} />
      </section>
    </section>
  );
}
