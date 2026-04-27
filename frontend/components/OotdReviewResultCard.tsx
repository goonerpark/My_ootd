"use client";

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

function renderStars(rating: number) {
  const rounded = Math.max(0, Math.min(5, Math.round(rating)));
  return "★".repeat(rounded) + "☆".repeat(5 - rounded);
}

function splitFeedback(text: string | null) {
  if (!text || text.trim().length === 0) {
    return {
      good: ["분석 내용이 없습니다."],
      improve: ["개선 포인트가 없습니다."]
    };
  }

  const sentences = text
    .split(/(?<=[.!?]|요)\s+/)
    .map((s) => s.trim())
    .filter(Boolean);

  const improveKeywords = ["아쉽", "부족", "개선", "과하", "주의", "이색", "조화", "불균형"];
  const improve = sentences.filter((s) => improveKeywords.some((k) => s.includes(k)));
  const good = sentences.filter((s) => !improve.includes(s));

  return {
    good: good.length > 0 ? good : ["장점 설명이 충분하지 않습니다."],
    improve: improve.length > 0 ? improve : ["큰 개선점은 없어 보입니다."]
  };
}

function formatDateTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
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
  body
}: {
  title: string;
  body: string | null;
}) {
  const analysis = splitFeedback(body);
  return (
    <article className="ootdFeedbackCard">
      <h3>{title}</h3>
      <div className="ootdFeedbackColumns">
        <section>
          <p className="ootdFeedbackTitle">좋은 점</p>
          <ul className="ootdFeedbackList">
            {analysis.good.map((line, idx) => (
              <li key={`${title}-good-${idx}`}>{line}</li>
            ))}
          </ul>
        </section>
        <section>
          <p className="ootdFeedbackTitle">개선 포인트</p>
          <ul className="ootdFeedbackList">
            {analysis.improve.map((line, idx) => (
              <li key={`${title}-improve-${idx}`}>{line}</li>
            ))}
          </ul>
        </section>
      </div>
    </article>
  );
}

export function OotdReviewResultCard({ title, review }: OotdReviewResultCardProps) {
  if (!review) {
    return (
      <section className="sectionCard">
        <h2>{title}</h2>
        <EmptyState description="표시할 평가 결과가 없습니다." />
      </section>
    );
  }

  const mappedImageUrls = review.imageUrls.map(normalizeImageUrl);
  const displayImage = mappedImageUrls.find(canRenderImage);

  return (
    <section className="sectionCard">
      <h2>{title}</h2>

      <div className="ootdResultLayout">
        <div className="ootdResultImageCol">
          {displayImage ? (
            <img className="ootdResultMainImage" src={displayImage} alt="업로드한 OOTD 이미지" />
          ) : (
            <div className="ootdResultImageFallback">이미지를 표시할 수 없습니다.</div>
          )}
          {!displayImage && mappedImageUrls.length > 0 && <p className="ootdStorageUrl">저장 URL: {mappedImageUrls[0]}</p>}
        </div>

        <div className="ootdResultInfoCol">
          <div className="ootdRatingBox">
            <p className="ootdRatingValue">{review.rating.toFixed(1)}</p>
            <p className="ootdRatingStars">{renderStars(review.rating)}</p>
            <p className="muted">OOTD 종합 별점</p>
          </div>
          <p className="muted">리뷰 날짜: {review.reviewDate}</p>
          <p className="muted">생성 시각: {formatDateTime(review.createdAt)}</p>
          <p className="ootdModelVersion">모델 버전: {review.aiModelVersion ?? "없음"}</p>
        </div>
      </div>

      <div className="ootdFeedbackGrid">
        <FeedbackCard title="핏 분석" body={review.fitFeedback} />
        <FeedbackCard title="색 조합 분석" body={review.colorFeedback} />
        <FeedbackCard title="종합 평가" body={review.overallFeedback} />
      </div>
    </section>
  );
}
