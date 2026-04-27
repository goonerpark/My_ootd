"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ApiRequestError, fetchClosetItems, fetchOotdReviews, fetchTodaySurvey } from "@/lib/api/client";
import type { ClosetItem, OotdReview, TodaySurvey } from "@/lib/api/types";
import { getAccessTokenFromStorage, getAuthUserProfileFromStorage } from "@/lib/auth/token";
import { getClosetCategoryLabel, getClosetFitLabel } from "@/lib/closet/options";
import { ErrorMessage, LoadingState, PageHeader, SectionCard } from "@/components/ui";

function toKoreanErrorMessage(message: string) {
  if (message === "Authentication is required") {
    return "로그인이 필요한 기능입니다.";
  }
  if (message === "Unexpected server error") {
    return "서버에서 예기치 못한 오류가 발생했습니다.";
  }
  return message;
}

export default function MyPage() {
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [recentClosetItems, setRecentClosetItems] = useState<ClosetItem[]>([]);
  const [recentOotdReviews, setRecentOotdReviews] = useState<OotdReview[]>([]);
  const [todaySurvey, setTodaySurvey] = useState<TodaySurvey | null>(null);
  const [surveyStatus, setSurveyStatus] = useState<"done" | "none" | "error">("none");

  const userProfile = getAuthUserProfileFromStorage();

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
        const [closetResult, reviewResult, surveyResult] = await Promise.allSettled([
          fetchClosetItems(localToken),
          fetchOotdReviews(localToken),
          fetchTodaySurvey(localToken)
        ]);

        if (closetResult.status === "fulfilled") {
          setRecentClosetItems(closetResult.value.slice(0, 3));
        }
        if (reviewResult.status === "fulfilled") {
          setRecentOotdReviews(reviewResult.value.slice(0, 3));
        }

        if (surveyResult.status === "fulfilled") {
          setTodaySurvey(surveyResult.value);
          setSurveyStatus("done");
        } else {
          if (surveyResult.reason instanceof ApiRequestError && surveyResult.reason.status === 404) {
            setSurveyStatus("none");
          } else {
            setSurveyStatus("error");
          }
        }

        if (closetResult.status === "rejected" && reviewResult.status === "rejected") {
          const message =
            closetResult.reason instanceof Error
              ? toKoreanErrorMessage(closetResult.reason.message)
              : reviewResult.reason instanceof Error
                ? toKoreanErrorMessage(reviewResult.reason.message)
                : "마이페이지 정보를 불러오지 못했습니다.";
          setError(message);
        }
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  if (!token) {
    return (
      <main className="page">
        <section className="container">
          <PageHeader title="마이페이지" subtitle="회원 전용 기능" />
          <SectionCard>
            <p className="muted">로그인하면 마이페이지에서 기능을 한 번에 확인할 수 있어요.</p>
            <div className="inlineActions">
              <Link className="primaryBtn" href="/login">
                로그인
              </Link>
              <Link className="ghostBtn" href="/signup">
                회원가입
              </Link>
            </div>
          </SectionCard>
        </section>
      </main>
    );
  }

  return (
    <main className="page">
      <section className="container">
        <PageHeader title="마이페이지" subtitle="내 프로필과 주요 기능, 최근 활동을 확인하세요." />

        {loading && <LoadingState label="마이페이지 정보를 불러오는 중입니다..." />}
        {error && <ErrorMessage message={error} />}

        <SectionCard title="프로필 카드">
          <div className="mypageProfileGrid">
            <p className="muted">닉네임: {userProfile?.nickname ?? "-"}</p>
            <p className="muted">이메일: {userProfile?.email ?? "-"}</p>
            <p className="muted">성별: {userProfile?.gender === "MALE" ? "남성" : userProfile?.gender === "FEMALE" ? "여성" : "-"}</p>
            <p className="muted">퍼스널 컬러: -</p>
            <p className="muted">체형: -</p>
          </div>
        </SectionCard>

        <SectionCard title="주요 기능 바로가기">
          <div className="mypageQuickGrid">
            <Link className="ghostBtn" href="/">
              오늘의 옷 추천
            </Link>
            <Link className="ghostBtn" href="/">
              주간 추천
            </Link>
            <Link className="ghostBtn" href="/survey">
              오늘 설문
            </Link>
            <Link className="ghostBtn" href="/closet">
              나의 옷장
            </Link>
            <Link className="ghostBtn" href="/ootd">
              OOTD 평가
            </Link>
            <Link className="ghostBtn" href="/ootd">
              OOTD 리뷰 기록
            </Link>
          </div>
        </SectionCard>

        <SectionCard title="요약 섹션">
          <div className="mypageSummaryGrid">
            <article className="mypageSummaryCard">
              <h3>최근 OOTD 리뷰 3개</h3>
              {recentOotdReviews.length === 0 ? (
                <p className="muted">리뷰 기록이 없습니다.</p>
              ) : (
                <ul className="list">
                  {recentOotdReviews.map((review) => (
                    <li key={review.id}>
                      {review.reviewDate} / 별점 {review.rating.toFixed(1)}
                    </li>
                  ))}
                </ul>
              )}
            </article>

            <article className="mypageSummaryCard">
              <h3>최근 옷장 아이템 3개</h3>
              {recentClosetItems.length === 0 ? (
                <p className="muted">옷장 아이템이 없습니다.</p>
              ) : (
                <ul className="list">
                  {recentClosetItems.map((item) => (
                    <li key={item.id}>
                      {getClosetCategoryLabel(item.category)} / {item.color ?? "-"} / {getClosetFitLabel(item.fit)}
                    </li>
                  ))}
                </ul>
              )}
            </article>

            <article className="mypageSummaryCard">
              <h3>오늘 설문 상태</h3>
              {surveyStatus === "done" && todaySurvey && (
                <>
                  <p className="muted">작성 완료 ({todaySurvey.outingPurpose})</p>
                  <p className="muted">{todaySurvey.notes ?? "메모 없음"}</p>
                </>
              )}
              {surveyStatus === "none" && <p className="muted">아직 작성하지 않았습니다.</p>}
              {surveyStatus === "error" && <p className="muted">설문 상태를 확인하지 못했습니다.</p>}
            </article>
          </div>
        </SectionCard>
      </section>
    </main>
  );
}
