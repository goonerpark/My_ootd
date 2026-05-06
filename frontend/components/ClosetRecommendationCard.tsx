import Image from "next/image";
import type { RecommendationSlot, TodayClosetRecommendation } from "@/lib/api/types";
import { getClosetCategoryLabel, getClosetFitLabel } from "@/lib/closet/options";
import { EmptyState, ErrorMessage, LoadingState } from "@/components/ui";

type Props = {
  data: TodayClosetRecommendation | null;
  loading: boolean;
  hasToken: boolean;
  error: string | null;
};

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080";

const SLOT_LABEL: Record<RecommendationSlot, string> = {
  TOP: "상의",
  OUTER: "아우터",
  BOTTOM: "하의",
  SHOES: "신발",
  ACCESSORY: "액세서리"
};

function normalizeImageUrl(url: string) {
  if (url.startsWith("local://closet-items/")) {
    const filename = url.replace("local://closet-items/", "");
    return `${API_BASE_URL}/uploads/closet-items/${filename}`;
  }
  return url;
}

function findSlotItem(data: TodayClosetRecommendation, slot: RecommendationSlot) {
  return data.closetItems.find((item) => item.slot === slot) ?? null;
}

function slotFallbackText(data: TodayClosetRecommendation, slot: RecommendationSlot) {
  switch (slot) {
    case "TOP":
      return data.top;
    case "OUTER":
      return data.outer;
    case "BOTTOM":
      return data.bottom;
    case "SHOES":
      return data.shoes;
    case "ACCESSORY":
      return data.accessory;
    default:
      return "옷장에 적합한 아이템 없음";
  }
}

function ClosetSlotCard({ data, slot }: { data: TodayClosetRecommendation; slot: RecommendationSlot }) {
  const item = findSlotItem(data, slot);
  const slotLabel = SLOT_LABEL[slot];

  if (!item) {
    return (
      <article className="closetRecoCard fallback">
        <h4>{slotLabel}</h4>
        <p className="muted">{slotFallbackText(data, slot) || "옷장에 적합한 아이템 없음"}</p>
      </article>
    );
  }

  return (
    <article className="closetRecoCard">
      <h4>{slotLabel}</h4>
      <Image className="closetRecoImage object-cover" src={normalizeImageUrl(item.imageUrl)} alt={`${slotLabel} 추천 아이템`} width={320} height={320} sizes="(max-width: 768px) 50vw, 20vw" />
      <div className="closetTagRow">
        <span className="closetTag">{getClosetCategoryLabel(item.category)}</span>
        {item.color && <span className="closetTag">{item.color}</span>}
        <span className="closetTag">{getClosetFitLabel(item.fit)}</span>
      </div>
      {item.brand && <p className="muted">브랜드: {item.brand}</p>}
      <p className="muted">{item.reason}</p>
    </article>
  );
}

export function ClosetRecommendationCard({ data, loading, hasToken, error }: Props) {
  return (
    <section className="sectionCard">
      <h2>내 옷장 기반 추천</h2>
      <p className="muted">기존 AI 추천과 별도로, 옷장 아이템을 우선으로 추천합니다.</p>

      {!hasToken && <p className="muted">로그인하면 옷장 기반 추천을 확인할 수 있습니다.</p>}
      {hasToken && loading && <LoadingState label="옷장 추천 정보를 불러오는 중입니다..." />}
      {hasToken && !loading && error && <ErrorMessage message={error} />}
      {hasToken && !loading && !error && !data && <EmptyState description="옷장 추천 데이터가 없습니다." />}

      {hasToken && !loading && !error && data && (
        <>
          {data.closetItems.length === 0 && (
            <p className="muted">현재 조건에 맞는 옷장 아이템이 없어 기본 추천을 제공합니다.</p>
          )}
          <div className="closetRecoGrid">
            <ClosetSlotCard data={data} slot="TOP" />
            <ClosetSlotCard data={data} slot="OUTER" />
            <ClosetSlotCard data={data} slot="BOTTOM" />
            <ClosetSlotCard data={data} slot="SHOES" />
            <ClosetSlotCard data={data} slot="ACCESSORY" />
          </div>
          <p className="muted">{data.summaryComment}</p>
        </>
      )}
    </section>
  );
}

