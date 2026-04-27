import type { TodayWeather } from "@/lib/api/types";
import { EmptyState, LoadingState } from "@/components/ui";

type Props = {
  data: TodayWeather | null;
  loading: boolean;
};

export function WeatherCard({ data, loading }: Props) {
  return (
    <section className="sectionCard">
      <h2>오늘 날씨</h2>
      {loading && <LoadingState label="날씨 정보를 불러오는 중입니다..." />}
      {!loading && !data && <EmptyState description="날씨 데이터가 없습니다." />}
      {!loading && data && (
        <ul className="list">
          <li>날씨: {data.weatherMain}</li>
          <li>설명: {data.weatherDescription}</li>
          <li>현재 기온: {data.currentTemp}°C</li>
          <li>
            최저/최고: {data.minTemp}°C / {data.maxTemp}°C
          </li>
          <li>습도: {data.humidity}%</li>
          <li>강수 확률: {data.precipitationProbability}%</li>
        </ul>
      )}
    </section>
  );
}
