import type { OutingPurpose } from "@/lib/api/types";
import type { ColdSensitivity, Duration, Mobility, StyleMood } from "./types";

export const OUTING_PURPOSE_OPTIONS: Array<{ value: OutingPurpose; label: string }> = [
  { value: "WORK", label: "출근" },
  { value: "SCHOOL", label: "등교" },
  { value: "DATE", label: "데이트" },
  { value: "EXERCISE", label: "운동" },
  { value: "FORMAL", label: "격식 있는 자리" },
  { value: "TRAVEL", label: "여행" },
  { value: "CASUAL", label: "가벼운 외출" },
  { value: "QUICK_OUTING", label: "잠깐 외출" }
];

export const DURATION_OPTIONS: Array<{ value: Duration; label: string }> = [
  { value: "SHORT", label: "1시간 이내" },
  { value: "MEDIUM", label: "1~3시간" },
  { value: "LONG", label: "3~6시간" },
  { value: "ALL_DAY", label: "하루 종일" }
];

export const MOBILITY_OPTIONS: Array<{ value: Mobility; label: string }> = [
  { value: "LOW", label: "거의 없음" },
  { value: "MEDIUM", label: "보통" },
  { value: "HIGH", label: "많음" }
];

export const STYLE_MOOD_OPTIONS: Array<{ value: StyleMood; label: string }> = [
  { value: "NEAT", label: "깔끔하게" },
  { value: "COMFY", label: "편안하게" },
  { value: "STYLISH", label: "꾸민 느낌" },
  { value: "ACTIVE", label: "활동성" },
  { value: "SIMPLE", label: "무난하게" }
];

export const COLD_SENSITIVITY_OPTIONS: Array<{ value: ColdSensitivity; label: string }> = [
  { value: "HIGH", label: "많이 탐" },
  { value: "NORMAL", label: "보통" },
  { value: "LOW", label: "거의 안 탐" }
];

export const OUTING_PURPOSE_LABELS = Object.fromEntries(
  OUTING_PURPOSE_OPTIONS.map((option) => [option.value, option.label])
) as Record<OutingPurpose, string>;

export const DURATION_LABELS = Object.fromEntries(DURATION_OPTIONS.map((option) => [option.value, option.label])) as Record<
  Duration,
  string
>;

export const MOBILITY_LABELS = Object.fromEntries(MOBILITY_OPTIONS.map((option) => [option.value, option.label])) as Record<
  Mobility,
  string
>;

export const STYLE_MOOD_LABELS = Object.fromEntries(STYLE_MOOD_OPTIONS.map((option) => [option.value, option.label])) as Record<
  StyleMood,
  string
>;

export const COLD_SENSITIVITY_LABELS = Object.fromEntries(
  COLD_SENSITIVITY_OPTIONS.map((option) => [option.value, option.label])
) as Record<ColdSensitivity, string>;
