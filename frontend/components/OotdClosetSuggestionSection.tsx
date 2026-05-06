"use client";

import Image from "next/image";
import { ChevronRight } from "lucide-react";
import type { OotdClosetSuggestion, OotdClosetSuggestionsResult } from "@/lib/api/types";
import { EmptyState, ErrorMessage, LoadingState } from "@/components/ui";

type Props = {
  data: OotdClosetSuggestionsResult | null;
  loading: boolean;
  error: string | null;
};

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080";

function normalizeImageUrl(url?: string | null) {
  if (!url) return null;
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

function SuggestionCard({ item }: { item: OotdClosetSuggestion }) {
  const imageUrl = normalizeImageUrl(item.imageUrl);

  return (
    <article className="group overflow-hidden rounded-3xl border border-surface-container bg-white soft-shadow">
      <div className="relative aspect-square overflow-hidden bg-slate-100">
        {imageUrl ? (
          <Image
            className="object-cover transition-transform duration-500 group-hover:scale-110"
            src={imageUrl}
            alt="옷장 대체 추천 아이템"
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-caption-xs font-bold text-secondary">
            이미지 없음
          </div>
        )}
      </div>
      <div className="p-5">
        <span className="mb-2 block text-caption-xs font-bold uppercase tracking-wider text-secondary">{categoryLabel(item.category)}</span>
        <h4 className="mb-1 font-label-sm text-label-sm text-primary">{item.brand || item.memo || `${item.color ?? ""} ${categoryLabel(item.category)}`}</h4>
        <p className="mb-3 text-caption-xs text-secondary">
          {item.color ?? "-"} / {fitLabel(item.fit)} / {item.season ?? "-"}
        </p>
        <div className="rounded-xl border border-tertiary-fixed-dim bg-tertiary-fixed p-3">
          <p className="text-caption-xs leading-relaxed text-on-tertiary-fixed">
            <span className="font-bold">추천 이유:</span> {item.reason}
          </p>
        </div>
      </div>
    </article>
  );
}

export function OotdClosetSuggestionSection({ data, loading, error }: Props) {
  return (
    <section className="space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="font-headline-md text-headline-md text-primary">내 옷장의 대체 아이템 추천</h2>
        <span className="flex items-center gap-1 font-bold text-primary">
          전체 보기 <ChevronRight size={18} />
        </span>
      </div>

      {loading && <LoadingState label="대체 추천을 불러오는 중입니다..." />}
      {!loading && error && <ErrorMessage message={error} />}
      {!loading && !error && !data && <EmptyState description="대체 추천 데이터가 없습니다." />}
      {!loading && !error && data && (
        <>
          {data.message && <p className="text-body-md text-secondary">{data.message}</p>}
          {data.suggestions.length === 0 ? (
            <EmptyState description="현재 옷장에는 추천할 만한 대체 아이템이 없습니다." />
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
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
