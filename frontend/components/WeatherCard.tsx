import type { TodayWeather } from "@/lib/api/types";

type Props = {
  data: TodayWeather | null;
  loading: boolean;
};

export function WeatherCard({ data, loading }: Props) {
  return (
    <section className="panel">
      <h2>오늘 날씨</h2>
      {loading && <p className="muted">날씨 정보를 불러오는 중...</p>}
      {!loading && !data && <p className="muted">날씨 데이터가 없습니다.</p>}
      {!loading && data && (
        <ul className="list">
          <li>날씨: {data.weatherMain}</li>
          <li>설명: {data.weatherDescription}</li>
          <li>현재 기온: {data.currentTemp}°C</li>
          <li>최저/최고: {data.minTemp}°C / {data.maxTemp}°C</li>
          <li>습도: {data.humidity}%</li>
          <li>강수 확률: {data.precipitationProbability}%</li>
        </ul>
      )}
    </section>
  );
}
