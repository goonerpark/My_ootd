'use client';

import Link from 'next/link';
import { CalendarDays, Cloud, CloudRain, Clock, LocateFixed, MapPin, RefreshCw, Sparkles, Sun } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { AppShell } from '@/components/layout';
import { fetchTodayWeather, fetchWeeklyRecommendations } from '@/lib/api/client';
import type { TodayWeather, WeeklyRecommendationItem } from '@/lib/api/types';
import { getAccessTokenFromStorage } from '@/lib/auth/token';

type WeatherLocationOption = {
  label: string;
  regionCode: string;
  lat: number;
  lon: number;
};

const LOCATION_OPTIONS: WeatherLocationOption[] = [
  { label: '분당구 백현동', regionCode: 'BUNDANG_BAEKHYEON', lat: 37.3947, lon: 127.1112 },
  { label: '서울 중구', regionCode: 'SEOUL_JUNGGU', lat: 37.5665, lon: 126.9780 },
  { label: '강남구 역삼동', regionCode: 'GANGNAM_YEOKSAM', lat: 37.5007, lon: 127.0365 },
  { label: '부산 해운대구', regionCode: 'BUSAN_HAEUNDAE', lat: 35.1631, lon: 129.1636 }
];

function toDateInputValue(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function tomorrowInputValue() {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  return toDateInputValue(date);
}

function temp(value?: number | null) {
  return typeof value === 'number' ? `${Math.round(value)}°` : '-';
}

function WeatherIcon({ main, size = 46 }: { main?: string; size?: number }) {
  const lower = (main ?? '').toLowerCase();
  if (lower.includes('rain')) return <CloudRain size={size} className="text-primary" />;
  if (lower.includes('cloud')) return <Cloud size={size} className="text-stone-400" />;
  return <Sun size={size} className="text-amber-400" />;
}

export default function WeatherPage() {
  const [selectedLocation, setSelectedLocation] = useState<WeatherLocationOption>(LOCATION_OPTIONS[0]);
  const [targetDate, setTargetDate] = useState(tomorrowInputValue);
  const [startHour, setStartHour] = useState('17');
  const [endHour, setEndHour] = useState('23');
  const [weather, setWeather] = useState<TodayWeather | null>(null);
  const [weekly, setWeekly] = useState<WeeklyRecommendationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [geoMessage, setGeoMessage] = useState<string | null>('현재 위치를 확인할 수 있으면 자동으로 반영합니다.');

  const hours = useMemo(() => Array.from({ length: 24 }, (_, index) => String(index).padStart(2, '0')), []);

  useEffect(() => {
    const token = getAccessTokenFromStorage();
    if (token) fetchWeeklyRecommendations(token).then(setWeekly).catch(() => setWeekly([]));
  }, []);

  useEffect(() => {
    if (!navigator.geolocation) {
      setGeoMessage('브라우저에서 현재 위치 기능을 지원하지 않아 기본 지역을 사용합니다.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = Number(position.coords.latitude.toFixed(4));
        const lon = Number(position.coords.longitude.toFixed(4));
        setSelectedLocation({
          label: '현재 위치',
          regionCode: `GEO_${lat.toFixed(3)}_${lon.toFixed(3)}`,
          lat,
          lon
        });
        setGeoMessage('현재 위치를 기준으로 날씨를 조회합니다.');
      },
      () => setGeoMessage('위치 권한이 없어 선택된 기본 지역을 사용합니다.'),
      { enableHighAccuracy: false, timeout: 5000, maximumAge: 10 * 60 * 1000 }
    );
  }, []);

  useEffect(() => {
    let ignore = false;
    const load = async () => {
      setLoading(true);
      setErrorMessage(null);
      try {
        const data = await fetchTodayWeather({
          regionCode: selectedLocation.regionCode,
          lat: selectedLocation.lat,
          lon: selectedLocation.lon,
          targetDate,
          startHour,
          endHour
        });
        if (!ignore) setWeather(data);
      } catch {
        if (!ignore) {
          setWeather(null);
          setErrorMessage('날씨 정보를 불러오지 못했습니다. 지역 또는 네트워크 상태를 확인해주세요.');
        }
      } finally {
        if (!ignore) setLoading(false);
      }
    };
    load();
    return () => { ignore = true; };
  }, [selectedLocation, targetDate, startHour, endHour]);

  const rainy = (weather?.precipitationProbability ?? 0) >= 50;
  const selectedTimeLabel = `${startHour}시~${endHour}시`;

  return (
    <AppShell activePath="/weather" withFooter>
      <div className="mx-auto max-w-6xl px-6 py-8">
        <header className="mb-10 flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div>
            <span className="mb-2 block text-xs font-bold uppercase tracking-widest text-[#5A6D5E]">Location Weather</span>
            <h1 className="font-headline text-4xl font-bold text-primary">날씨 리포트</h1>
            <p className="mt-1 text-on-surface-variant">지역과 외출 시간을 고르면 해당 조건으로 날씨를 조회합니다.</p>
          </div>
          <button
            type="button"
            onClick={() => setSelectedLocation(LOCATION_OPTIONS[0])}
            className="inline-flex w-fit items-center gap-2 rounded-full border border-outline-variant bg-white px-5 py-3 text-sm font-bold text-primary shadow-sm transition hover:bg-surface-container-low"
          >
            <RefreshCw size={16} /> 기본 지역으로
          </button>
        </header>

        <section className="mb-8 grid grid-cols-1 gap-4 rounded-[2rem] border border-stone-50 bg-white p-6 shadow-[0_10px_30px_rgba(0,0,0,0.04)] md:grid-cols-4">
          <label className="space-y-2">
            <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-stone-400"><MapPin size={14} /> 지역</span>
            <select
              value={selectedLocation.regionCode}
              onChange={(event) => setSelectedLocation(LOCATION_OPTIONS.find((item) => item.regionCode === event.target.value) ?? LOCATION_OPTIONS[0])}
              className="w-full rounded-2xl border-outline-variant bg-surface-container-low px-4 py-3 text-sm font-semibold text-primary focus:border-primary focus:ring-primary-container"
            >
              {selectedLocation.regionCode.startsWith('GEO_') && <option value={selectedLocation.regionCode}>{selectedLocation.label}</option>}
              {LOCATION_OPTIONS.map((option) => <option key={option.regionCode} value={option.regionCode}>{option.label}</option>)}
            </select>
          </label>

          <label className="space-y-2">
            <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-stone-400"><CalendarDays size={14} /> 날짜</span>
            <input
              type="date"
              value={targetDate}
              min={toDateInputValue(new Date())}
              onChange={(event) => setTargetDate(event.target.value)}
              className="w-full rounded-2xl border-outline-variant bg-surface-container-low px-4 py-3 text-sm font-semibold text-primary focus:border-primary focus:ring-primary-container"
            />
          </label>

          <label className="space-y-2">
            <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-stone-400"><Clock size={14} /> 시작 시간</span>
            <select value={startHour} onChange={(event) => setStartHour(event.target.value)} className="w-full rounded-2xl border-outline-variant bg-surface-container-low px-4 py-3 text-sm font-semibold text-primary focus:border-primary focus:ring-primary-container">
              {hours.map((hour) => <option key={hour} value={hour}>{hour}시</option>)}
            </select>
          </label>

          <label className="space-y-2">
            <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-stone-400"><Clock size={14} /> 종료 시간</span>
            <select value={endHour} onChange={(event) => setEndHour(event.target.value)} className="w-full rounded-2xl border-outline-variant bg-surface-container-low px-4 py-3 text-sm font-semibold text-primary focus:border-primary focus:ring-primary-container">
              {hours.map((hour) => <option key={hour} value={hour}>{hour}시</option>)}
            </select>
          </label>

          <div className="md:col-span-4 flex items-center gap-2 rounded-2xl bg-primary-container/10 px-4 py-3 text-sm text-primary">
            <LocateFixed size={16} /> {geoMessage}
          </div>
        </section>

        {errorMessage && <div className="mb-6 rounded-2xl border border-error-container bg-error-container/25 p-4 text-sm text-on-error-container">{errorMessage}</div>}

        <div className="grid grid-cols-1 gap-6 md:grid-cols-12">
          <section className="space-y-6 md:col-span-8">
            <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-[#5A6D5E] via-[#425547] to-[#1b1c1a] p-8 text-white shadow-sm md:min-h-[360px]">
              <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
              <div className="relative z-10 flex h-full flex-col justify-between gap-10">
                <div className="flex items-start justify-between gap-6">
                  <div>
                    <p className="text-sm font-semibold text-white/70">{selectedLocation.label} · {targetDate} · {selectedTimeLabel}</p>
                    <h2 className="mt-4 font-headline text-5xl font-black">{loading ? '조회 중...' : temp(weather?.currentTemp)}</h2>
                    <p className="mt-3 text-xl text-white/80">{weather?.weatherDescription ?? '선택한 조건의 날씨 정보가 없습니다.'}</p>
                  </div>
                  <div className="rounded-3xl bg-white/15 p-5 backdrop-blur-md"><WeatherIcon main={weather?.weatherMain} size={58} /></div>
                </div>
                <div className="rounded-3xl bg-white/12 p-5 backdrop-blur-md">
                  <h3 className="mb-2 flex items-center gap-2 font-headline text-xl font-semibold"><Sparkles size={20} /> 코디 팁</h3>
                  <p className="leading-relaxed text-white/80">
                    {rainy
                      ? '비 가능성이 높습니다. 미끄럽지 않은 신발과 방수 가능한 아우터를 우선 고려해보세요.'
                      : '외출 시간대의 기온 차이를 확인하고, 얇은 레이어드로 조절하기 쉬운 착장을 준비해보세요.'}
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-[2rem] border border-stone-50 bg-white p-8 shadow-sm">
              <h2 className="mb-6 font-headline text-xl font-semibold text-primary">상세 날씨 정보</h2>
              {loading ? (
                <p className="text-sm text-stone-400">날씨 정보를 불러오는 중입니다...</p>
              ) : weather ? (
                <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                  <Metric label="최저 / 최고" value={`${temp(weather.minTemp)} / ${temp(weather.maxTemp)}`} />
                  <Metric label="강수 확률" value={`${weather.precipitationProbability ?? '-'}%`} />
                  <Metric label="습도" value={`${weather.humidity ?? '-'}%`} />
                  <Metric label="날씨 상태" value={weather.weatherMain ?? '-'} />
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-outline-variant bg-surface-container-low p-8 text-center text-on-surface-variant">
                  선택한 위치의 날씨 데이터가 없습니다.
                </div>
              )}
            </div>
          </section>

          <aside className="space-y-6 md:col-span-4">
            <div className="group relative overflow-hidden rounded-[2rem] bg-primary p-8 text-on-primary shadow-xl">
              <h2 className="relative z-10 mb-4 font-headline text-2xl font-semibold">AI 코디 추천 받기</h2>
              <p className="relative z-10 mb-8 text-sm leading-relaxed opacity-90">선택한 날씨와 오늘 설문을 함께 반영해 더 현실적인 OOTD를 추천받을 수 있습니다.</p>
              <Link href="/survey" className="relative z-10 flex w-full items-center justify-center gap-2 rounded-2xl bg-white py-4 font-bold text-primary transition hover:bg-on-primary-container">
                추천 시작하기 <Sparkles size={18} />
              </Link>
            </div>

            <div className="rounded-[2rem] border border-stone-50 bg-white p-8 shadow-sm">
              <h2 className="mb-6 font-headline text-xl font-semibold text-primary">주간 예보</h2>
              <div className="space-y-5">
                {weekly.slice(0, 7).map((item) => (
                  <div key={item.targetDate} className="flex items-center justify-between">
                    <span className="w-20 text-sm text-on-surface-variant">{item.targetDate.slice(5)}</span>
                    <WeatherIcon main={item.weather.weatherMain} size={24} />
                    <div className="flex items-center gap-3"><span className="font-bold">{temp(item.weather.maxTemp)}</span><span className="text-sm text-stone-300">{temp(item.weather.minTemp)}</span></div>
                  </div>
                ))}
                {weekly.length === 0 && <p className="text-sm text-stone-500">로그인하면 주간 추천 예보를 함께 볼 수 있어요.</p>}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </AppShell>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return <div className="rounded-2xl bg-surface-container-low p-4"><p className="text-xs text-stone-400">{label}</p><p className="mt-1 font-bold text-primary">{value}</p></div>;
}