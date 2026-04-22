import type { TodayRecommendation } from "@/lib/api/types";
import type { SurveyFormState } from "./types";

const SURVEY_STATE_KEY = "ootd_survey_state";
const RECOMMENDATION_RESULT_KEY = "ootd_recommendation_result";
const RECOMMENDATION_ERROR_KEY = "ootd_recommendation_error";

function safeParse<T>(value: string | null): T | null {
  if (!value) {
    return null;
  }
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

export function getSavedSurveyState() {
  if (typeof window === "undefined") {
    return null;
  }
  return safeParse<SurveyFormState>(window.sessionStorage.getItem(SURVEY_STATE_KEY));
}

export function saveSurveyState(state: SurveyFormState) {
  if (typeof window === "undefined") {
    return;
  }
  window.sessionStorage.setItem(SURVEY_STATE_KEY, JSON.stringify(state));
}

export function getSavedRecommendationResult() {
  if (typeof window === "undefined") {
    return null;
  }
  return safeParse<TodayRecommendation>(window.sessionStorage.getItem(RECOMMENDATION_RESULT_KEY));
}

export function saveRecommendationResult(result: TodayRecommendation) {
  if (typeof window === "undefined") {
    return;
  }
  window.sessionStorage.setItem(RECOMMENDATION_RESULT_KEY, JSON.stringify(result));
  window.sessionStorage.removeItem(RECOMMENDATION_ERROR_KEY);
}

export function getRecommendationError() {
  if (typeof window === "undefined") {
    return null;
  }
  return window.sessionStorage.getItem(RECOMMENDATION_ERROR_KEY);
}

export function saveRecommendationError(message: string) {
  if (typeof window === "undefined") {
    return;
  }
  window.sessionStorage.setItem(RECOMMENDATION_ERROR_KEY, message);
  window.sessionStorage.removeItem(RECOMMENDATION_RESULT_KEY);
}
