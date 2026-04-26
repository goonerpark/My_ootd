import type { ClosetCategory, ClosetFit, ClosetSeason, ClosetThickness } from "@/lib/api/types";

export const CLOSET_CATEGORY_OPTIONS: Array<{ value: ClosetCategory; label: string }> = [
  { value: "TOP", label: "상의" },
  { value: "OUTER", label: "아우터" },
  { value: "BOTTOM", label: "하의" },
  { value: "SHOES", label: "신발" },
  { value: "ACCESSORY", label: "액세서리" }
];

export const CLOSET_SEASON_OPTIONS: Array<{ value: ClosetSeason; label: string }> = [
  { value: "ALL", label: "사계절" },
  { value: "SPRING", label: "봄" },
  { value: "SUMMER", label: "여름" },
  { value: "AUTUMN", label: "가을" },
  { value: "WINTER", label: "겨울" }
];

export const CLOSET_THICKNESS_OPTIONS: Array<{ value: ClosetThickness; label: string }> = [
  { value: "THIN", label: "얇음" },
  { value: "NORMAL", label: "보통" },
  { value: "THICK", label: "두꺼움" }
];

export const CLOSET_FIT_OPTIONS: Array<{ value: ClosetFit; label: string }> = [
  { value: "SLIM", label: "슬림핏" },
  { value: "REGULAR", label: "레귤러핏" },
  { value: "OVER", label: "오버핏" },
  { value: "WIDE", label: "와이드핏" },
  { value: "UNKNOWN", label: "모름" }
];

export function getClosetCategoryLabel(value: ClosetCategory) {
  return CLOSET_CATEGORY_OPTIONS.find((option) => option.value === value)?.label ?? value;
}

export function getClosetSeasonLabel(value: ClosetSeason) {
  return CLOSET_SEASON_OPTIONS.find((option) => option.value === value)?.label ?? value;
}

export function getClosetThicknessLabel(value: ClosetThickness) {
  return CLOSET_THICKNESS_OPTIONS.find((option) => option.value === value)?.label ?? value;
}

export function getClosetFitLabel(value: ClosetFit) {
  return CLOSET_FIT_OPTIONS.find((option) => option.value === value)?.label ?? value;
}
