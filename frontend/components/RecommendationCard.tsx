import type { TodayRecommendation } from "@/lib/api/types";
import { EmptyState, LoadingState } from "@/components/ui";

type Props = {
  data: TodayRecommendation | null;
  loading: boolean;
};

export function RecommendationCard({ data, loading }: Props) {
  return (
    <section className="sectionCard">
      <h2>오늘 추천</h2>
      {loading && <LoadingState label="추천 정보를 불러오는 중입니다..." />}
      {!loading && !data && <EmptyState description="추천 데이터가 없습니다." />}
      {!loading && data && (
        <ul className="list">
          <li>상의: {data.topItem ?? "-"}</li>
          <li>아우터: {data.outerItem ?? "-"}</li>
          <li>하의: {data.bottomItem ?? "-"}</li>
          <li>신발: {data.shoesItem ?? "-"}</li>
          <li>액세서리: {data.accessoryItem ?? "-"}</li>
          <li>코멘트: {data.summaryComment ?? "-"}</li>
        </ul>
      )}
    </section>
  );
}
