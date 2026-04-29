export type RecommendationFeedbackValue = "LIKE" | "DISLIKE" | "TOO_COLD" | "TOO_HOT" | "NOT_MY_STYLE";

export type RecommendationFeedbackEntry = {
  value: RecommendationFeedbackValue;
  label: string;
  recommendationId: number | null;
  targetDate: string | null;
  source: "dashboard" | "result";
  createdAt: string;
};

const LATEST_FEEDBACK_KEY = "ootd_latest_recommendation_feedback";
const FEEDBACK_HISTORY_KEY = "ootd_recommendation_feedback_history";

export const RECOMMENDATION_FEEDBACK_OPTIONS: Array<{ value: RecommendationFeedbackValue; label: string; note: string }> = [
  {
    value: "LIKE",
    label: "\uB9C8\uC74C\uC5D0 \uB4E4\uC5B4\uC694",
    note: "\uC774\uC804 \uCD94\uCC9C\uC774 \uB9C8\uC74C\uC5D0 \uB4E4\uC5C8\uACE0 \uBE44\uC2B7\uD55C \uBC29\uD5A5\uC744 \uC120\uD638\uD569\uB2C8\uB2E4."
  },
  {
    value: "DISLIKE",
    label: "\uBCC4\uB85C\uC608\uC694",
    note: "\uC774\uC804 \uCD94\uCC9C\uC774 \uC804\uBC18\uC801\uC73C\uB85C \uC544\uC26C\uC6E0\uC2B5\uB2C8\uB2E4."
  },
  {
    value: "TOO_COLD",
    label: "\uB108\uBB34 \uCD25\uACA0\uC5B4\uC694",
    note: "\uC774\uC804 \uCD94\uCC9C\uC740 \uCD94\uC6B8 \uAC83 \uAC19\uC544\uC11C \uBCF4\uC628\uAC10\uC744 \uB354 \uC6D0\uD569\uB2C8\uB2E4."
  },
  {
    value: "TOO_HOT",
    label: "\uB108\uBB34 \uB354\uC6CC\uC694",
    note: "\uC774\uC804 \uCD94\uCC9C\uC740 \uB354\uC6B8 \uAC83 \uAC19\uC544\uC11C \uB354 \uAC00\uBCCD\uACE0 \uD1B5\uAE30\uC131 \uC788\uB294 \uCF54\uB514\uB97C \uC6D0\uD569\uB2C8\uB2E4."
  },
  {
    value: "NOT_MY_STYLE",
    label: "\uB0B4 \uC2A4\uD0C0\uC77C \uC544\uB2D8",
    note: "\uC774\uC804 \uCD94\uCC9C\uC740 \uCDE8\uD5A5\uACFC \uB2EC\uB77C\uC11C \uC120\uD638 \uC2A4\uD0C0\uC77C\uC744 \uB354 \uAC15\uD558\uAC8C \uBC18\uC601\uD574 \uC8FC\uC138\uC694."
  }
];

function safeParse<T>(value: string | null): T | null {
  if (!value) return null;
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

function findOption(value: RecommendationFeedbackValue) {
  return RECOMMENDATION_FEEDBACK_OPTIONS.find((option) => option.value === value);
}

export function getLatestRecommendationFeedback() {
  if (typeof window === "undefined") return null;
  return safeParse<RecommendationFeedbackEntry>(window.localStorage.getItem(LATEST_FEEDBACK_KEY));
}

export function saveRecommendationFeedback(
  value: RecommendationFeedbackValue,
  params: { recommendationId?: number | null; targetDate?: string | null; source: "dashboard" | "result" }
) {
  if (typeof window === "undefined") return null;

  const option = findOption(value);
  const entry: RecommendationFeedbackEntry = {
    value,
    label: option?.label ?? value,
    recommendationId: params.recommendationId ?? null,
    targetDate: params.targetDate ?? null,
    source: params.source,
    createdAt: new Date().toISOString()
  };

  const history = safeParse<RecommendationFeedbackEntry[]>(window.localStorage.getItem(FEEDBACK_HISTORY_KEY)) ?? [];
  window.localStorage.setItem(LATEST_FEEDBACK_KEY, JSON.stringify(entry));
  window.localStorage.setItem(FEEDBACK_HISTORY_KEY, JSON.stringify([entry, ...history].slice(0, 20)));
  return entry;
}

export function buildLatestFeedbackSurveyNote() {
  const latest = getLatestRecommendationFeedback();
  if (!latest) return "";

  const option = findOption(latest.value);
  if (!option) return "";

  return `[\uCD94\uCC9C \uD53C\uB4DC\uBC31] ${option.note}`;
}
