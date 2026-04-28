"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Camera, CheckCircle2, Grid2X2, History, PlusCircle, Save, Settings, Shirt, UserRound } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { AppShell } from "@/components/layout";
import { ErrorMessage, LoadingState } from "@/components/ui";
import { ApiRequestError, fetchClosetItems, fetchMyProfile, fetchOotdReviews, fetchTodaySurvey, updateMyProfile } from "@/lib/api/client";
import type { BodyType, ClosetItem, OotdReview, PersonalColor, TodaySurvey, UserProfile } from "@/lib/api/types";
import { getAccessTokenFromStorage, setAuthUserProfileToStorage } from "@/lib/auth/token";
import { getClosetCategoryLabel, getClosetFitLabel } from "@/lib/closet/options";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080";
const PLACEHOLDER_IMAGE = "/mock/base.svg";

const PERSONAL_COLOR_OPTIONS: Array<{ value: PersonalColor; label: string }> = [
  { value: "UNKNOWN", label: "잘 모르겠어요" },
  { value: "SPRING_WARM", label: "봄 웜톤" },
  { value: "SUMMER_COOL", label: "여름 쿨톤" },
  { value: "AUTUMN_WARM", label: "가을 웜톤" },
  { value: "WINTER_COOL", label: "겨울 쿨톤" }
];

const BODY_TYPE_OPTIONS: Array<{ value: BodyType; label: string }> = [
  { value: "UNKNOWN", label: "잘 모르겠어요" },
  { value: "SLIM", label: "슬림" },
  { value: "NORMAL", label: "보통" },
  { value: "MUSCULAR", label: "근육형" },
  { value: "CHUBBY", label: "통통" }
];

function toKoreanErrorMessage(message: string) {
  if (message === "Authentication is required") return "로그인이 필요한 기능입니다.";
  if (message === "Unexpected server error") return "서버에서 예기치 못한 오류가 발생했습니다.";
  return message;
}

function normalizeClosetImage(url?: string | null) {
  if (!url) return PLACEHOLDER_IMAGE;
  if (url.startsWith("local://closet-items/")) {
    const filename = url.replace("local://closet-items/", "");
    return `${API_BASE_URL}/uploads/closet-items/${filename}`;
  }
  return url;
}

function normalizeOotdImage(url?: string | null) {
  if (!url) return PLACEHOLDER_IMAGE;
  if (url.startsWith("local://ootd-reviews/")) {
    const filename = url.replace("local://ootd-reviews/", "");
    return `${API_BASE_URL}/uploads/ootd-reviews/${filename}`;
  }
  return url;
}

function genderLabel(value?: "MALE" | "FEMALE") {
  if (value === "MALE") return "남성";
  if (value === "FEMALE") return "여성";
  return "-";
}

function labelOf<T extends string>(options: Array<{ value: T; label: string }>, value?: T | null) {
  return options.find((option) => option.value === value)?.label ?? "-";
}

function displayNumber(value?: number | null, suffix = "") {
  return value == null ? "-" : `${value}${suffix}`;
}

function toOptionalNumber(value: string) {
  if (!value.trim()) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function ShortcutCard({ href, icon: Icon, title, subtitle }: { href: string; icon: LucideIcon; title: string; subtitle: string }) {
  return (
    <Link className="group rounded-3xl border border-surface-container bg-white p-6 transition-all duration-300 hover:border-primary hover:shadow-md" href={href}>
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-surface-container-low transition-colors group-hover:bg-primary group-hover:text-on-primary">
        <Icon size={22} />
      </div>
      <p className="font-label-sm text-label-sm text-primary">{title}</p>
      <p className="font-caption-xs text-caption-xs text-on-surface-variant">{subtitle}</p>
    </Link>
  );
}

export default function MyPage() {
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [recentClosetItems, setRecentClosetItems] = useState<ClosetItem[]>([]);
  const [recentOotdReviews, setRecentOotdReviews] = useState<OotdReview[]>([]);
  const [todaySurvey, setTodaySurvey] = useState<TodaySurvey | null>(null);
  const [surveyStatus, setSurveyStatus] = useState<"done" | "none" | "error">("none");
  const [personalColor, setPersonalColor] = useState<PersonalColor>("UNKNOWN");
  const [bodyType, setBodyType] = useState<BodyType>("UNKNOWN");
  const [heightCm, setHeightCm] = useState("");
  const [weightKg, setWeightKg] = useState("");
  const [preferredStyle, setPreferredStyle] = useState("");

  useEffect(() => {
    const localToken = getAccessTokenFromStorage();
    setToken(localToken);
    if (!localToken) {
      setLoading(false);
      return;
    }

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const [profileResult, closetResult, reviewResult, surveyResult] = await Promise.allSettled([
          fetchMyProfile(localToken),
          fetchClosetItems(localToken),
          fetchOotdReviews(localToken),
          fetchTodaySurvey(localToken)
        ]);

        if (profileResult.status === "fulfilled") {
          applyProfile(profileResult.value);
        } else {
          setError(profileResult.reason instanceof Error ? toKoreanErrorMessage(profileResult.reason.message) : "프로필 정보를 불러오지 못했습니다.");
        }

        if (closetResult.status === "fulfilled") setRecentClosetItems(closetResult.value.slice(0, 3));
        if (reviewResult.status === "fulfilled") setRecentOotdReviews(reviewResult.value.slice(0, 3));

        if (surveyResult.status === "fulfilled") {
          setTodaySurvey(surveyResult.value);
          setSurveyStatus("done");
        } else if (surveyResult.reason instanceof ApiRequestError && surveyResult.reason.status === 404) {
          setSurveyStatus("none");
        } else {
          setSurveyStatus("error");
        }
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const applyProfile = (nextProfile: UserProfile) => {
    setProfile(nextProfile);
    setPersonalColor(nextProfile.personalColor ?? "UNKNOWN");
    setBodyType(nextProfile.bodyType ?? "UNKNOWN");
    setHeightCm(nextProfile.heightCm == null ? "" : String(nextProfile.heightCm));
    setWeightKg(nextProfile.weightKg == null ? "" : String(nextProfile.weightKg));
    setPreferredStyle(nextProfile.preferredStyle ?? "");
    setAuthUserProfileToStorage({
      userId: nextProfile.userId,
      email: nextProfile.email,
      nickname: nextProfile.nickname,
      gender: nextProfile.gender
    });
  };

  const onSaveProfile = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!token) return;
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const updated = await updateMyProfile(token, {
        personalColor,
        bodyType,
        heightCm: toOptionalNumber(heightCm),
        weightKg: toOptionalNumber(weightKg),
        preferredStyle: preferredStyle.trim() || null
      });
      applyProfile(updated);
      setSuccess("프로필 정보가 저장되었습니다.");
    } catch (err) {
      setError(err instanceof Error ? toKoreanErrorMessage(err.message) : "프로필 저장에 실패했습니다.");
    } finally {
      setSaving(false);
    }
  };

  if (!token) {
    return (
      <AppShell activePath="/mypage">
        <section className="rounded-3xl border border-surface-container bg-white p-8 shadow-soft">
          <h1 className="font-headline-md text-headline-md">Profile & Preferences</h1>
          <p className="mt-2 text-secondary">로그인하면 성별, 체형, 퍼스널 컬러 등 나만의 스타일 정보를 관리할 수 있어요.</p>
          <div className="mt-5 flex gap-2">
            <Link className="rounded-full bg-primary px-5 py-2 text-sm font-bold text-white" href="/login">로그인</Link>
            <Link className="rounded-full border border-outline-variant bg-white px-5 py-2 text-sm font-bold text-primary" href="/signup">회원가입</Link>
          </div>
        </section>
      </AppShell>
    );
  }

  return (
    <AppShell activePath="/mypage">
      <div className="space-y-12">
        {loading && <LoadingState label="마이페이지 정보를 불러오는 중입니다..." />}
        {error && <ErrorMessage message={error} />}
        {success && <div className="rounded-2xl border border-green-100 bg-green-50 p-4 text-sm font-bold text-green-700">{success}</div>}

        <section className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          <article className="flex flex-col items-center gap-8 rounded-3xl border border-surface-container-high bg-white p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] md:flex-row md:items-start lg:col-span-2">
            <div className="grid h-32 w-32 place-items-center overflow-hidden rounded-full border-4 border-surface-container bg-surface-container-low text-5xl font-black text-primary">
              {(profile?.nickname ?? "M").slice(0, 1).toUpperCase()}
            </div>
            <div className="flex-1 text-center md:text-left">
              <div className="mb-4">
                <h1 className="font-display-lg text-display-lg text-primary">{profile?.nickname ?? "스타일 사용자"}</h1>
                <p className="font-body-md text-body-md text-on-surface-variant">{profile?.email ?? "-"}</p>
              </div>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                <ProfileFact label="성별" value={genderLabel(profile?.gender)} />
                <ProfileFact label="퍼스널 컬러" value={labelOf(PERSONAL_COLOR_OPTIONS, profile?.personalColor)} />
                <ProfileFact label="체형" value={labelOf(BODY_TYPE_OPTIONS, profile?.bodyType)} />
                <ProfileFact label="키" value={displayNumber(profile?.heightCm, "cm")} />
                <ProfileFact label="몸무게" value={displayNumber(profile?.weightKg, "kg")} />
                <ProfileFact label="선호 스타일" value={profile?.preferredStyle ?? "-"} />
              </div>
            </div>
          </article>

          <article className="flex flex-col justify-between rounded-3xl bg-primary p-8 text-on-primary shadow-xl">
            <div>
              <h2 className="mb-2 font-title-sm text-title-sm">오늘의 데일리 설문</h2>
              <p className="mb-6 font-body-md text-body-md opacity-80">오늘 일정과 기분을 알려주면 더 정확한 추천을 받을 수 있어요.</p>
            </div>
            <div className="rounded-2xl border border-white/20 bg-white/10 p-4 backdrop-blur-md">
              <div className="mb-2 flex items-center justify-between">
                <span className="font-label-sm text-label-sm">상태</span>
                <span className="font-label-sm text-label-sm">{surveyStatus === "done" ? "작성 완료" : "대기 중"}</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-white/20">
                <div className={surveyStatus === "done" ? "h-full w-full bg-white" : "h-full w-1/4 bg-white"} />
              </div>
              <Link className="mt-4 block w-full rounded-xl bg-white py-3 text-center font-bold text-primary transition-opacity hover:opacity-90" href="/survey">
                {surveyStatus === "done" ? "설문 다시 작성" : "설문 작성하기"}
              </Link>
            </div>
          </article>
        </section>

        <section className="rounded-3xl border border-surface-container bg-white p-6 shadow-soft">
          <div className="mb-5 flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-2xl bg-surface-container-low text-primary">
              <UserRound size={22} />
            </div>
            <div>
              <h2 className="font-title-sm text-title-sm text-primary">개인 스타일 정보</h2>
              <p className="text-sm text-secondary">추천 정확도를 높이기 위해 체형, 퍼스널 컬러, 키/몸무게를 입력해 주세요.</p>
            </div>
          </div>
          <form className="grid grid-cols-1 gap-4 md:grid-cols-2" onSubmit={onSaveProfile}>
            <label className="space-y-2">
              <span className="text-sm font-bold text-primary">퍼스널 컬러</span>
              <select className="w-full rounded-2xl border border-surface-container bg-surface-container-low px-4 py-3" value={personalColor} onChange={(event) => setPersonalColor(event.target.value as PersonalColor)}>
                {PERSONAL_COLOR_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
            </label>
            <label className="space-y-2">
              <span className="text-sm font-bold text-primary">체형</span>
              <select className="w-full rounded-2xl border border-surface-container bg-surface-container-low px-4 py-3" value={bodyType} onChange={(event) => setBodyType(event.target.value as BodyType)}>
                {BODY_TYPE_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
            </label>
            <label className="space-y-2">
              <span className="text-sm font-bold text-primary">키(cm)</span>
              <input className="w-full rounded-2xl border border-surface-container bg-surface-container-low px-4 py-3" inputMode="decimal" placeholder="예: 172.5" value={heightCm} onChange={(event) => setHeightCm(event.target.value)} />
            </label>
            <label className="space-y-2">
              <span className="text-sm font-bold text-primary">몸무게(kg)</span>
              <input className="w-full rounded-2xl border border-surface-container bg-surface-container-low px-4 py-3" inputMode="decimal" placeholder="예: 65.0" value={weightKg} onChange={(event) => setWeightKg(event.target.value)} />
            </label>
            <label className="space-y-2 md:col-span-2">
              <span className="text-sm font-bold text-primary">선호 스타일</span>
              <input className="w-full rounded-2xl border border-surface-container bg-surface-container-low px-4 py-3" maxLength={50} placeholder="예: 미니멀, 캐주얼, 포멀" value={preferredStyle} onChange={(event) => setPreferredStyle(event.target.value)} />
            </label>
            <button className="inline-flex items-center justify-center gap-2 rounded-2xl bg-primary px-6 py-3 font-bold text-white shadow-lg transition hover:opacity-90 disabled:opacity-60 md:col-span-2" type="submit" disabled={saving}>
              <Save size={18} />
              {saving ? "저장 중..." : "프로필 저장"}
            </button>
          </form>
        </section>

        <section>
          <h2 className="mb-6 flex items-center gap-2 font-title-sm text-title-sm"><Grid2X2 size={22} />바로가기</h2>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <ShortcutCard href="/closet" icon={Shirt} title="나의 옷장" subtitle={`${recentClosetItems.length} recent`} />
            <ShortcutCard href="/ootd" icon={History} title="OOTD 히스토리" subtitle="최근 리뷰" />
            <ShortcutCard href="/survey" icon={CheckCircle2} title="스타일 설문" subtitle="매일 업데이트" />
            <ShortcutCard href="/ootd" icon={Camera} title="OOTD 평가" subtitle="사진 업로드" />
          </div>
        </section>

        <div className="grid grid-cols-1 gap-12 lg:grid-cols-2">
          <RecentOotdSection reviews={recentOotdReviews} />
          <RecentClosetSection items={recentClosetItems} />
        </div>

        {surveyStatus === "done" && todaySurvey && (
          <section className="rounded-3xl border border-surface-container bg-white p-6 shadow-soft">
            <h2 className="mb-2 font-title-sm text-title-sm">오늘 설문 상태</h2>
            <p className="text-secondary">작성 완료: {todaySurvey.outingPurpose}</p>
            <p className="mt-1 text-secondary">{todaySurvey.notes ?? "메모 없음"}</p>
          </section>
        )}
        {surveyStatus === "error" && <section className="rounded-3xl border border-surface-container bg-white p-6 text-secondary shadow-soft">설문 상태를 확인하지 못했습니다.</section>}
      </div>
    </AppShell>
  );
}

function ProfileFact({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-surface-container-low p-3">
      <p className="mb-1 font-caption-xs text-caption-xs text-on-surface-variant">{label}</p>
      <p className="font-label-sm text-label-sm text-primary">{value}</p>
    </div>
  );
}

function RecentOotdSection({ reviews }: { reviews: OotdReview[] }) {
  return (
    <section>
      <div className="mb-6 flex items-center justify-between">
        <h2 className="font-title-sm text-title-sm">최근 OOTD 리뷰</h2>
        <Link className="font-label-sm text-label-sm text-on-surface-variant hover:text-primary" href="/ootd">전체보기</Link>
      </div>
      <div className="space-y-4">
        {reviews.length === 0 ? (
          <div className="rounded-2xl border border-surface-container bg-white p-6 text-secondary">리뷰 기록이 없습니다.</div>
        ) : reviews.map((review) => (
          <Link className="flex items-center gap-4 rounded-2xl border border-surface-container bg-white p-4 transition-shadow hover:shadow-sm" href="/ootd" key={review.id}>
            <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-xl">
              <img className="h-full w-full object-cover" src={normalizeOotdImage(review.imageUrls[0])} alt="OOTD 리뷰 이미지" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-3">
                <p className="font-label-sm text-label-sm text-primary">{review.reviewDate}</p>
                <span className="rounded bg-green-50 px-2 py-0.5 text-[10px] font-bold text-green-700">{review.rating.toFixed(1)}점</span>
              </div>
              <p className="mt-1 truncate font-caption-xs text-caption-xs text-on-surface-variant">{review.overallFeedback ?? "피드백 없음"}</p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

function RecentClosetSection({ items }: { items: ClosetItem[] }) {
  return (
    <section>
      <div className="mb-6 flex items-center justify-between">
        <h2 className="font-title-sm text-title-sm">최근 등록한 의류</h2>
        <Link className="font-label-sm text-label-sm text-on-surface-variant hover:text-primary" href="/closet">전체보기</Link>
      </div>
      {items.length === 0 ? (
        <div className="rounded-2xl border border-surface-container bg-white p-6 text-secondary">옷장 아이템이 없습니다.</div>
      ) : (
        <div className="grid grid-cols-3 gap-4">
          {items.map((item) => (
            <div className="space-y-2" key={item.id}>
              <div className="aspect-square overflow-hidden rounded-2xl border border-surface-container bg-white p-2">
                <img className="h-full w-full object-cover" src={normalizeClosetImage(item.imageUrl)} alt="최근 등록 의류" />
              </div>
              <p className="truncate text-center font-caption-xs text-caption-xs font-bold text-primary">
                {item.subcategory || `${getClosetCategoryLabel(item.category)} / ${item.color ?? "-"} / ${getClosetFitLabel(item.fit)}`}
              </p>
            </div>
          ))}
        </div>
      )}
      <Link className="mt-8 flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-outline-variant bg-surface-container-low p-6 transition-colors hover:bg-surface-container" href="/closet">
        <PlusCircle className="mb-2 text-outline" size={24} />
        <p className="font-label-sm text-label-sm text-on-surface-variant">새로운 옷 등록하기</p>
      </Link>
    </section>
  );
}