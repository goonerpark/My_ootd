"use client";

import type { OotdClosetSuggestion, OotdClosetSuggestionsResult } from "@/lib/api/types";
import { EmptyState, ErrorMessage, LoadingState } from "@/components/ui";

type Props = {
  data: OotdClosetSuggestionsResult | null;
  loading: boolean;
  error: string | null;
};

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080";

function normalizeImageUrl(url?: string | null) {
  if (!url) {
    return null;
  }
  if (url.startsWith("local://closet-items/")) {
    const filename = url.replace("local://closet-items/", "");
    return `${API_BASE_URL}/uploads/closet-items/${filename}`;
  }
  return url;
}

function categoryLabel(value: OotdClosetSuggestion["category"]) {
  switch (value) {
    case "TOP":
      return "상의";
    case "OUTER":
      return "아우터";
    case "BOTTOM":
      return "하의";
    case "SHOES":
      return "신발";
    case "ACCESSORY":
      return "액세서리";
    default:
      return value;
  }
}

function fitLabel(value?: OotdClosetSuggestion["fit"]) {
  switch (value) {
    case "SLIM":
      return "슬림핏";
    case "REGULAR":
      return "레귤러핏";
    case "OVER":
      return "오버핏";
    case "WIDE":
      return "와이드핏";
    case "UNKNOWN":
      return "모름";
    default:
      return "-";
  }
}

function reasonTag(reason: string) {
  if (reason.includes("핏")) {
    return "핏 피드백 기반 추천";
  }
  if (reason.includes("색") || reason.includes("컬러")) {
    return "색상 피드백 기반 추천";
  }
  return "OOTD 피드백 기반 추천";
}

function SuggestionCard({ item }: { item: OotdClosetSuggestion }) {
  const imageUrl = normalizeImageUrl(item.imageUrl);
  return (
    <article className="ootdSuggestionCard">
      {imageUrl ? (
        <img className="ootdSuggestionImage" src={imageUrl} alt="옷장 대체 추천 아이템" />
      ) : (
        <div className="ootdSuggestionImagePlaceholder">이미지 없음</div>
      )}
      <div className="ootdSuggestionBody">
        <p className="ootdSuggestionTag">{reasonTag(item.reason)}</p>
        <p className="muted">카테고리: {categoryLabel(item.category)}</p>
        <p className="muted">색상: {item.color ?? "-"}</p>
        <p className="muted">핏: {fitLabel(item.fit)}</p>
        <p className="muted">시즌: {item.season ?? "-"}</p>
        <p className="muted">두께: {item.thickness ?? "-"}</p>
        <p className="muted">브랜드/메모: {item.brand ?? item.memo ?? "-"}</p>
        <p className="ootdSuggestionReason">{item.reason}</p>
      </div>
    </article>
  );
}

export function OotdClosetSuggestionSection({ data, loading, error }: Props) {
  return (
    <section className="sectionCard">
      <h2>내 옷장에서 대체 추천</h2>
      {loading && <LoadingState label="대체 추천을 불러오는 중입니다..." />}
      {!loading && error && <ErrorMessage message={error} />}
      {!loading && !error && !data && <EmptyState description="대체 추천 데이터가 없습니다." />}
      {!loading && !error && data && (
        <>
          {data.message && <p className="muted">{data.message}</p>}
          {data.suggestions.length === 0 ? (
            <EmptyState description="현재 옷장에는 추천할 만한 대체 아이템이 없습니다." />
          ) : (
            <div className="ootdSuggestionGrid">
              {data.suggestions.map((item) => (
                <SuggestionCard key={`${item.closetItemId}-${item.category}`} item={item} />
              ))}
            </div>
          )}
        </>
      )}
    </section>
  );
}
