'use client';

import Link from 'next/link';
import { CalendarDays, Cloud, CloudRain, MapPin, Sparkles, Sun } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
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

type WeatherProvinceOption = {
  province: string;
  cities: WeatherLocationOption[];
};

const PROVINCE_OPTIONS: WeatherProvinceOption[] = [
  {
    province: '서울특별시',
    cities: [
      { label: '종로구', regionCode: 'SEOUL_JONGNO', lat: 37.5735, lon: 126.9790 },
      { label: '중구', regionCode: 'SEOUL_JUNGGU', lat: 37.5636, lon: 126.9976 },
      { label: '용산구', regionCode: 'SEOUL_YONGSAN', lat: 37.5326, lon: 126.9905 },
      { label: '성동구', regionCode: 'SEOUL_SEONGDONG', lat: 37.5633, lon: 127.0369 },
      { label: '광진구', regionCode: 'SEOUL_GWANGJIN', lat: 37.5384, lon: 127.0822 },
      { label: '동대문구', regionCode: 'SEOUL_DONGDAEMUN', lat: 37.5744, lon: 127.0396 },
      { label: '중랑구', regionCode: 'SEOUL_JUNGNANG', lat: 37.6063, lon: 127.0927 },
      { label: '성북구', regionCode: 'SEOUL_SEONGBUK', lat: 37.5894, lon: 127.0167 },
      { label: '강북구', regionCode: 'SEOUL_GANGBUK', lat: 37.6396, lon: 127.0257 },
      { label: '도봉구', regionCode: 'SEOUL_DOBONG', lat: 37.6688, lon: 127.0471 },
      { label: '노원구', regionCode: 'SEOUL_NOWON', lat: 37.6542, lon: 127.0568 },
      { label: '은평구', regionCode: 'SEOUL_EUNPYEONG', lat: 37.6027, lon: 126.9291 },
      { label: '서대문구', regionCode: 'SEOUL_SEODAEMUN', lat: 37.5791, lon: 126.9368 },
      { label: '마포구', regionCode: 'SEOUL_MAPO', lat: 37.5663, lon: 126.9019 },
      { label: '양천구', regionCode: 'SEOUL_YANGCHEON', lat: 37.5169, lon: 126.8664 },
      { label: '강서구', regionCode: 'SEOUL_GANGSEO', lat: 37.5509, lon: 126.8495 },
      { label: '구로구', regionCode: 'SEOUL_GURO', lat: 37.4955, lon: 126.8874 },
      { label: '금천구', regionCode: 'SEOUL_GEUMCHEON', lat: 37.4569, lon: 126.8955 },
      { label: '영등포구', regionCode: 'SEOUL_YEONGDEUNGPO', lat: 37.5264, lon: 126.8962 },
      { label: '동작구', regionCode: 'SEOUL_DONGJAK', lat: 37.5124, lon: 126.9393 },
      { label: '관악구', regionCode: 'SEOUL_GWANAK', lat: 37.4784, lon: 126.9516 },
      { label: '서초구', regionCode: 'SEOUL_SEOCHO', lat: 37.4836, lon: 127.0327 },
      { label: '강남구', regionCode: 'SEOUL_GANGNAM', lat: 37.5172, lon: 127.0473 },
      { label: '송파구', regionCode: 'SEOUL_SONGPA', lat: 37.5145, lon: 127.1059 },
      { label: '강동구', regionCode: 'SEOUL_GANGDONG', lat: 37.5301, lon: 127.1238 }
    ]
  },
  {
    province: '부산광역시',
    cities: [
      { label: '중구', regionCode: 'BUSAN_JUNGGU', lat: 35.1062, lon: 129.0323 },
      { label: '서구', regionCode: 'BUSAN_SEOGU', lat: 35.0979, lon: 129.0244 },
      { label: '동구', regionCode: 'BUSAN_DONGGU', lat: 35.1293, lon: 129.0455 },
      { label: '영도구', regionCode: 'BUSAN_YEONGDO', lat: 35.0912, lon: 129.0679 },
      { label: '부산진구', regionCode: 'BUSAN_BUSANJIN', lat: 35.1629, lon: 129.0532 },
      { label: '동래구', regionCode: 'BUSAN_DONGNAE', lat: 35.2055, lon: 129.0837 },
      { label: '남구', regionCode: 'BUSAN_NAMGU', lat: 35.1366, lon: 129.0844 },
      { label: '북구', regionCode: 'BUSAN_BUKGU', lat: 35.1970, lon: 128.9906 },
      { label: '해운대구', regionCode: 'BUSAN_HAEUNDAE', lat: 35.1631, lon: 129.1636 },
      { label: '사하구', regionCode: 'BUSAN_SAHA', lat: 35.1045, lon: 128.9748 },
      { label: '금정구', regionCode: 'BUSAN_GEUMJEONG', lat: 35.2430, lon: 129.0920 },
      { label: '강서구', regionCode: 'BUSAN_GANGSEO', lat: 35.2122, lon: 128.9800 },
      { label: '연제구', regionCode: 'BUSAN_YEONJE', lat: 35.1762, lon: 129.0798 },
      { label: '수영구', regionCode: 'BUSAN_SUYEONG', lat: 35.1457, lon: 129.1132 },
      { label: '사상구', regionCode: 'BUSAN_SASANG', lat: 35.1526, lon: 128.9910 },
      { label: '기장군', regionCode: 'BUSAN_GIJANG', lat: 35.2446, lon: 129.2220 }
    ]
  },
  {
    province: '대구광역시',
    cities: [
      { label: '중구', regionCode: 'DAEGU_JUNGGU', lat: 35.8693, lon: 128.6062 },
      { label: '동구', regionCode: 'DAEGU_DONGGU', lat: 35.8867, lon: 128.6356 },
      { label: '서구', regionCode: 'DAEGU_SEOGU', lat: 35.8719, lon: 128.5592 },
      { label: '남구', regionCode: 'DAEGU_NAMGU', lat: 35.8460, lon: 128.5970 },
      { label: '북구', regionCode: 'DAEGU_BUKGU', lat: 35.8859, lon: 128.5828 },
      { label: '수성구', regionCode: 'DAEGU_SUSEONG', lat: 35.8582, lon: 128.6306 },
      { label: '달서구', regionCode: 'DAEGU_DALSEO', lat: 35.8299, lon: 128.5327 },
      { label: '달성군', regionCode: 'DAEGU_DALSEONG', lat: 35.7746, lon: 128.4314 },
      { label: '군위군', regionCode: 'DAEGU_GUNWI', lat: 36.2429, lon: 128.5729 }
    ]
  },
  {
    province: '인천광역시',
    cities: [
      { label: '중구', regionCode: 'INCHEON_JUNGGU', lat: 37.4738, lon: 126.6216 },
      { label: '동구', regionCode: 'INCHEON_DONGGU', lat: 37.4739, lon: 126.6431 },
      { label: '미추홀구', regionCode: 'INCHEON_MICHUHOL', lat: 37.4636, lon: 126.6505 },
      { label: '연수구', regionCode: 'INCHEON_YEONSU', lat: 37.4102, lon: 126.6783 },
      { label: '남동구', regionCode: 'INCHEON_NAMDONG', lat: 37.4473, lon: 126.7315 },
      { label: '부평구', regionCode: 'INCHEON_BUPYEONG', lat: 37.5070, lon: 126.7218 },
      { label: '계양구', regionCode: 'INCHEON_GYEYANG', lat: 37.5374, lon: 126.7377 },
      { label: '서구', regionCode: 'INCHEON_SEOGU', lat: 37.5455, lon: 126.6759 },
      { label: '강화군', regionCode: 'INCHEON_GANGHWA', lat: 37.7465, lon: 126.4881 },
      { label: '옹진군', regionCode: 'INCHEON_ONGJIN', lat: 37.4466, lon: 126.6367 }
    ]
  },
  {
    province: '광주광역시',
    cities: [
      { label: '동구', regionCode: 'GWANGJU_DONGGU', lat: 35.1461, lon: 126.9231 },
      { label: '서구', regionCode: 'GWANGJU_SEOGU', lat: 35.1520, lon: 126.8903 },
      { label: '남구', regionCode: 'GWANGJU_NAMGU', lat: 35.1330, lon: 126.9025 },
      { label: '북구', regionCode: 'GWANGJU_BUKGU', lat: 35.1741, lon: 126.9119 },
      { label: '광산구', regionCode: 'GWANGJU_GWANGSAN', lat: 35.1395, lon: 126.7937 }
    ]
  },
  {
    province: '대전광역시',
    cities: [
      { label: '동구', regionCode: 'DAEJEON_DONGGU', lat: 36.3121, lon: 127.4549 },
      { label: '중구', regionCode: 'DAEJEON_JUNGGU', lat: 36.3254, lon: 127.4213 },
      { label: '서구', regionCode: 'DAEJEON_SEOGU', lat: 36.3555, lon: 127.3839 },
      { label: '유성구', regionCode: 'DAEJEON_YUSEONG', lat: 36.3622, lon: 127.3561 },
      { label: '대덕구', regionCode: 'DAEJEON_DAEDEOK', lat: 36.3466, lon: 127.4150 }
    ]
  },
  {
    province: '울산광역시',
    cities: [
      { label: '중구', regionCode: 'ULSAN_JUNGGU', lat: 35.5684, lon: 129.3326 },
      { label: '남구', regionCode: 'ULSAN_NAMGU', lat: 35.5438, lon: 129.3300 },
      { label: '동구', regionCode: 'ULSAN_DONGGU', lat: 35.5048, lon: 129.4167 },
      { label: '북구', regionCode: 'ULSAN_BUKGU', lat: 35.5827, lon: 129.3612 },
      { label: '울주군', regionCode: 'ULSAN_ULJU', lat: 35.5220, lon: 129.2422 }
    ]
  },
  {
    province: '세종특별자치시',
    cities: [{ label: '세종시', regionCode: 'SEJONG', lat: 36.4800, lon: 127.2890 }]
  },
  {
    province: '경기도',
    cities: [
      { label: '수원시', regionCode: 'GYEONGGI_SUWON', lat: 37.2636, lon: 127.0286 },
      { label: '성남시', regionCode: 'GYEONGGI_SEONGNAM', lat: 37.4200, lon: 127.1265 },
      { label: '의정부시', regionCode: 'GYEONGGI_UIJEONGBU', lat: 37.7381, lon: 127.0337 },
      { label: '안양시', regionCode: 'GYEONGGI_ANYANG', lat: 37.3943, lon: 126.9568 },
      { label: '부천시', regionCode: 'GYEONGGI_BUCHEON', lat: 37.5034, lon: 126.7660 },
      { label: '광명시', regionCode: 'GYEONGGI_GWANGMYEONG', lat: 37.4786, lon: 126.8647 },
      { label: '평택시', regionCode: 'GYEONGGI_PYEONGTAEK', lat: 36.9921, lon: 127.1127 },
      { label: '동두천시', regionCode: 'GYEONGGI_DONGDUCHEON', lat: 37.9036, lon: 127.0606 },
      { label: '안산시', regionCode: 'GYEONGGI_ANSAN', lat: 37.3219, lon: 126.8309 },
      { label: '고양시', regionCode: 'GYEONGGI_GOYANG', lat: 37.6584, lon: 126.8320 },
      { label: '과천시', regionCode: 'GYEONGGI_GWACHEON', lat: 37.4292, lon: 126.9876 },
      { label: '구리시', regionCode: 'GYEONGGI_GURI', lat: 37.5943, lon: 127.1296 },
      { label: '남양주시', regionCode: 'GYEONGGI_NAMYANGJU', lat: 37.6360, lon: 127.2165 },
      { label: '오산시', regionCode: 'GYEONGGI_OSAN', lat: 37.1498, lon: 127.0772 },
      { label: '시흥시', regionCode: 'GYEONGGI_SIHEUNG', lat: 37.3802, lon: 126.8029 },
      { label: '군포시', regionCode: 'GYEONGGI_GUNPO', lat: 37.3617, lon: 126.9352 },
      { label: '의왕시', regionCode: 'GYEONGGI_UIWANG', lat: 37.3447, lon: 126.9683 },
      { label: '하남시', regionCode: 'GYEONGGI_HANAM', lat: 37.5393, lon: 127.2149 },
      { label: '용인시', regionCode: 'GYEONGGI_YONGIN', lat: 37.2411, lon: 127.1776 },
      { label: '파주시', regionCode: 'GYEONGGI_PAJU', lat: 37.7602, lon: 126.7799 },
      { label: '이천시', regionCode: 'GYEONGGI_ICHEON', lat: 37.2724, lon: 127.4350 },
      { label: '안성시', regionCode: 'GYEONGGI_ANSEONG', lat: 37.0080, lon: 127.2797 },
      { label: '김포시', regionCode: 'GYEONGGI_GIMPO', lat: 37.6153, lon: 126.7156 },
      { label: '화성시', regionCode: 'GYEONGGI_HWASEONG', lat: 37.1995, lon: 126.8310 },
      { label: '광주시', regionCode: 'GYEONGGI_GWANGJU', lat: 37.4294, lon: 127.2550 },
      { label: '양주시', regionCode: 'GYEONGGI_YANGJU', lat: 37.7853, lon: 127.0458 },
      { label: '포천시', regionCode: 'GYEONGGI_POCHEON', lat: 37.8949, lon: 127.2003 },
      { label: '여주시', regionCode: 'GYEONGGI_YEOJU', lat: 37.2983, lon: 127.6371 }
    ]
  },
  {
    province: '강원특별자치도',
    cities: [
      { label: '춘천시', regionCode: 'GANGWON_CHUNCHEON', lat: 37.8813, lon: 127.7298 },
      { label: '원주시', regionCode: 'GANGWON_WONJU', lat: 37.3422, lon: 127.9202 },
      { label: '강릉시', regionCode: 'GANGWON_GANGNEUNG', lat: 37.7519, lon: 128.8761 },
      { label: '동해시', regionCode: 'GANGWON_DONGHAE', lat: 37.5248, lon: 129.1143 },
      { label: '태백시', regionCode: 'GANGWON_TAEBAEK', lat: 37.1640, lon: 128.9857 },
      { label: '속초시', regionCode: 'GANGWON_SOKCHO', lat: 38.2070, lon: 128.5918 },
      { label: '삼척시', regionCode: 'GANGWON_SAMCHEOK', lat: 37.4499, lon: 129.1652 }
    ]
  },
  {
    province: '충청북도',
    cities: [
      { label: '청주시', regionCode: 'CHUNGBUK_CHEONGJU', lat: 36.6424, lon: 127.4890 },
      { label: '충주시', regionCode: 'CHUNGBUK_CHUNGJU', lat: 36.9910, lon: 127.9259 },
      { label: '제천시', regionCode: 'CHUNGBUK_JECHEON', lat: 37.1326, lon: 128.1910 }
    ]
  },
  {
    province: '충청남도',
    cities: [
      { label: '천안시', regionCode: 'CHUNGNAM_CHEONAN', lat: 36.8151, lon: 127.1139 },
      { label: '공주시', regionCode: 'CHUNGNAM_GONGJU', lat: 36.4466, lon: 127.1190 },
      { label: '보령시', regionCode: 'CHUNGNAM_BORYEONG', lat: 36.3334, lon: 126.6128 },
      { label: '아산시', regionCode: 'CHUNGNAM_ASAN', lat: 36.7898, lon: 127.0017 },
      { label: '서산시', regionCode: 'CHUNGNAM_SEOSAN', lat: 36.7845, lon: 126.4503 },
      { label: '논산시', regionCode: 'CHUNGNAM_NONSAN', lat: 36.1871, lon: 127.0987 },
      { label: '계룡시', regionCode: 'CHUNGNAM_GYERYONG', lat: 36.2746, lon: 127.2486 },
      { label: '당진시', regionCode: 'CHUNGNAM_DANGJIN', lat: 36.8897, lon: 126.6459 }
    ]
  },
  {
    province: '전북특별자치도',
    cities: [
      { label: '전주시', regionCode: 'JEONBUK_JEONJU', lat: 35.8242, lon: 127.1480 },
      { label: '군산시', regionCode: 'JEONBUK_GUNSAN', lat: 35.9677, lon: 126.7366 },
      { label: '익산시', regionCode: 'JEONBUK_IKSAN', lat: 35.9483, lon: 126.9576 },
      { label: '정읍시', regionCode: 'JEONBUK_JEONGEUP', lat: 35.5699, lon: 126.8560 },
      { label: '남원시', regionCode: 'JEONBUK_NAMWON', lat: 35.4164, lon: 127.3904 },
      { label: '김제시', regionCode: 'JEONBUK_GIMJE', lat: 35.8036, lon: 126.8809 }
    ]
  },
  {
    province: '전라남도',
    cities: [
      { label: '목포시', regionCode: 'JEONNAM_MOKPO', lat: 34.8118, lon: 126.3922 },
      { label: '여수시', regionCode: 'JEONNAM_YEOSU', lat: 34.7604, lon: 127.6622 },
      { label: '순천시', regionCode: 'JEONNAM_SUNCHEON', lat: 34.9506, lon: 127.4875 },
      { label: '나주시', regionCode: 'JEONNAM_NAJU', lat: 35.0161, lon: 126.7108 },
      { label: '광양시', regionCode: 'JEONNAM_GWANGYANG', lat: 34.9407, lon: 127.6959 }
    ]
  },
  {
    province: '경상북도',
    cities: [
      { label: '포항시', regionCode: 'GYEONGBUK_POHANG', lat: 36.0190, lon: 129.3435 },
      { label: '경주시', regionCode: 'GYEONGBUK_GYEONGJU', lat: 35.8562, lon: 129.2247 },
      { label: '김천시', regionCode: 'GYEONGBUK_GIMCHEON', lat: 36.1398, lon: 128.1136 },
      { label: '안동시', regionCode: 'GYEONGBUK_ANDONG', lat: 36.5684, lon: 128.7294 },
      { label: '구미시', regionCode: 'GYEONGBUK_GUMI', lat: 36.1195, lon: 128.3446 },
      { label: '영주시', regionCode: 'GYEONGBUK_YEONGJU', lat: 36.8057, lon: 128.6240 },
      { label: '영천시', regionCode: 'GYEONGBUK_YEONGCHEON', lat: 35.9733, lon: 128.9386 },
      { label: '상주시', regionCode: 'GYEONGBUK_SANGJU', lat: 36.4109, lon: 128.1591 },
      { label: '문경시', regionCode: 'GYEONGBUK_MUNGYEONG', lat: 36.5865, lon: 128.1868 },
      { label: '경산시', regionCode: 'GYEONGBUK_GYEONGSAN', lat: 35.8251, lon: 128.7415 }
    ]
  },
  {
    province: '경상남도',
    cities: [
      { label: '창원시', regionCode: 'GYEONGNAM_CHANGWON', lat: 35.2279, lon: 128.6811 },
      { label: '진주시', regionCode: 'GYEONGNAM_JINJU', lat: 35.1803, lon: 128.1076 },
      { label: '통영시', regionCode: 'GYEONGNAM_TONGYEONG', lat: 34.8544, lon: 128.4332 },
      { label: '사천시', regionCode: 'GYEONGNAM_SACHEON', lat: 35.0035, lon: 128.0640 },
      { label: '김해시', regionCode: 'GYEONGNAM_GIMHAE', lat: 35.2285, lon: 128.8894 },
      { label: '밀양시', regionCode: 'GYEONGNAM_MIRYANG', lat: 35.5037, lon: 128.7465 },
      { label: '거제시', regionCode: 'GYEONGNAM_GEOJE', lat: 34.8806, lon: 128.6217 },
      { label: '양산시', regionCode: 'GYEONGNAM_YANGSAN', lat: 35.3350, lon: 129.0372 }
    ]
  },
  {
    province: '제주특별자치도',
    cities: [
      { label: '제주시', regionCode: 'JEJU_JEJU_CITY', lat: 33.4996, lon: 126.5312 },
      { label: '서귀포시', regionCode: 'JEJU_SEOGWIPO', lat: 33.2539, lon: 126.5590 }
    ]
  }
];
const DEFAULT_PROVINCE = '서울특별시';
const DEFAULT_LOCATION = PROVINCE_OPTIONS.find((item) => item.province === DEFAULT_PROVINCE)?.cities[0] ?? PROVINCE_OPTIONS[0].cities[0];

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

function getCityOptions(province: string, geoLocation: WeatherLocationOption | null) {
  if (province === '현재 위치' && geoLocation) return [geoLocation];
  return PROVINCE_OPTIONS.find((item) => item.province === province)?.cities ?? PROVINCE_OPTIONS[0].cities;
}

export default function WeatherPage() {
  const [selectedProvince, setSelectedProvince] = useState(DEFAULT_PROVINCE);
  const [selectedLocation, setSelectedLocation] = useState<WeatherLocationOption>(DEFAULT_LOCATION);
  const [geoLocation, setGeoLocation] = useState<WeatherLocationOption | null>(null);
  const [targetDate, setTargetDate] = useState(tomorrowInputValue);
  const [weather, setWeather] = useState<TodayWeather | null>(null);
  const [weekly, setWeekly] = useState<WeeklyRecommendationItem[]>([]);
  const [hasToken, setHasToken] = useState(false);
  const [weeklyLoading, setWeeklyLoading] = useState(false);
  const [weeklyError, setWeeklyError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const cityOptions = getCityOptions(selectedProvince, geoLocation);
  const provinceOptions = geoLocation ? ['현재 위치', ...PROVINCE_OPTIONS.map((item) => item.province)] : PROVINCE_OPTIONS.map((item) => item.province);

  const loadWeeklyRecommendations = useCallback(async () => {
    const token = getAccessTokenFromStorage();
    setHasToken(Boolean(token));
    setWeeklyError(null);

    if (!token) {
      setWeekly([]);
      setWeeklyLoading(false);
      return;
    }

    setWeeklyLoading(true);
    try {
      const data = await fetchWeeklyRecommendations(token);
      setWeekly(data);
    } catch {
      setWeekly([]);
      setWeeklyError('주간 추천 예보를 불러오지 못했습니다. 토큰이 만료됐다면 다시 로그인해주세요.');
    } finally {
      setWeeklyLoading(false);
    }
  }, []);

  useEffect(() => {
    loadWeeklyRecommendations();
    const handleFocus = () => loadWeeklyRecommendations();
    const handleStorage = () => loadWeeklyRecommendations();
    window.addEventListener('focus', handleFocus);
    window.addEventListener('storage', handleStorage);
    return () => {
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('storage', handleStorage);
    };
  }, [loadWeeklyRecommendations]);

  useEffect(() => {
    if (!navigator.geolocation) {
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = Number(position.coords.latitude.toFixed(4));
        const lon = Number(position.coords.longitude.toFixed(4));
        const currentLocation = {
          label: '현재 위치',
          regionCode: `GEO_${lat.toFixed(3)}_${lon.toFixed(3)}`,
          lat,
          lon
        };
        setGeoLocation(currentLocation);
        setSelectedProvince('현재 위치');
        setSelectedLocation(currentLocation);
      },
      () => undefined,
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
          targetDate
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
    return () => {
      ignore = true;
    };
  }, [selectedLocation, targetDate]);

  const rainy = (weather?.precipitationProbability ?? 0) >= 50;

  return (
    <AppShell activePath="/weather" withFooter>
      <div className="mx-auto max-w-6xl px-6 py-8">
        <header className="mb-10 flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div>
            <span className="mb-2 block text-xs font-bold uppercase tracking-widest text-[#5A6D5E]">Location Weather</span>
            <h1 className="font-headline text-4xl font-bold text-primary">날씨 리포트</h1>
            <p className="mt-1 text-on-surface-variant">도/광역시와 시/구를 고르면 해당 지역의 날씨를 조회합니다.</p>
          </div>
        </header>

        <section className="mb-8 grid grid-cols-1 gap-4 rounded-[2rem] border border-stone-50 bg-white p-6 shadow-[0_10px_30px_rgba(0,0,0,0.04)] md:grid-cols-3">
          <label className="space-y-2">
            <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-stone-400"><MapPin size={14} /> 도 / 광역시</span>
            <select
              value={selectedProvince}
              onChange={(event) => {
                const nextProvince = event.target.value;
                const nextCities = getCityOptions(nextProvince, geoLocation);
                setSelectedProvince(nextProvince);
                setSelectedLocation(nextCities[0]);
              }}
              className="w-full rounded-2xl border-outline-variant bg-surface-container-low px-4 py-3 text-sm font-semibold text-primary focus:border-primary focus:ring-primary-container"
            >
              {provinceOptions.map((province) => <option key={province} value={province}>{province}</option>)}
            </select>
          </label>

          <label className="space-y-2">
            <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-stone-400"><MapPin size={14} /> 시 / 구</span>
            <select
              value={selectedLocation.regionCode}
              onChange={(event) => setSelectedLocation(cityOptions.find((item) => item.regionCode === event.target.value) ?? cityOptions[0])}
              className="w-full rounded-2xl border-outline-variant bg-surface-container-low px-4 py-3 text-sm font-semibold text-primary focus:border-primary focus:ring-primary-container"
            >
              {cityOptions.map((option) => <option key={option.regionCode} value={option.regionCode}>{option.label}</option>)}
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

        </section>

        {errorMessage && <div className="mb-6 rounded-2xl border border-error-container bg-error-container/25 p-4 text-sm text-on-error-container">{errorMessage}</div>}

        <div className="grid grid-cols-1 gap-6 md:grid-cols-12">
          <section className="space-y-6 md:col-span-8">
            <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-[#5A6D5E] via-[#425547] to-[#1b1c1a] p-8 text-white shadow-sm md:min-h-[360px]">
              <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
              <div className="relative z-10 flex h-full flex-col justify-between gap-10">
                <div className="flex items-start justify-between gap-6">
                  <div>
                    <p className="text-sm font-semibold text-white/70">{selectedProvince} · {selectedLocation.label} · {targetDate}</p>
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
                      : '기온 차이를 확인하고, 얇은 레이어드로 조절하기 쉬운 착장을 준비해보세요.'}
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
              <p className="relative z-10 mb-8 text-sm leading-relaxed opacity-90">선택한 날씨와 오늘 설문을 함께 반영해 현실적인 OOTD를 추천받을 수 있습니다.</p>
              <Link href="/survey" className="relative z-10 flex w-full items-center justify-center gap-2 rounded-2xl bg-white py-4 font-bold text-primary transition hover:bg-on-primary-container">
                추천 시작하기 <Sparkles size={18} />
              </Link>
            </div>

            <div className="rounded-[2rem] border border-stone-50 bg-white p-8 shadow-sm">
              <div className="mb-6 flex items-center justify-between gap-3">
                <h2 className="font-headline text-xl font-semibold text-primary">주간 예보</h2>
                {hasToken && (
                  <button type="button" onClick={loadWeeklyRecommendations} className="text-xs font-bold text-stone-400 transition hover:text-primary">
                    새로고침
                  </button>
                )}
              </div>
              <div className="space-y-5">
                {weeklyLoading && <p className="text-sm text-stone-400">주간 추천 예보를 불러오는 중입니다...</p>}
                {!weeklyLoading && weeklyError && <p className="rounded-2xl bg-error-container/25 p-4 text-sm text-on-error-container">{weeklyError}</p>}
                {!weeklyLoading && !weeklyError && weekly.slice(0, 7).map((item) => (
                  <div key={item.targetDate} className="flex items-center justify-between">
                    <span className="w-20 text-sm text-on-surface-variant">{item.targetDate.slice(5)}</span>
                    <WeatherIcon main={item.weather.weatherMain} size={24} />
                    <div className="flex items-center gap-3"><span className="font-bold">{temp(item.weather.maxTemp)}</span><span className="text-sm text-stone-300">{temp(item.weather.minTemp)}</span></div>
                  </div>
                ))}
                {!weeklyLoading && !weeklyError && weekly.length === 0 && (
                  <p className="text-sm text-stone-500">
                    {hasToken ? '아직 표시할 주간 추천 예보가 없습니다. 새로고침을 눌러 다시 불러와보세요.' : '로그인하면 주간 추천 예보를 함께 볼 수 있어요.'}
                  </p>
                )}
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


