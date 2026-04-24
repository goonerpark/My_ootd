import type {
  ApiResponse,
  CreateOotdReviewPayload,
  Gender,
  LoginRequest,
  LoginResult,
  OotdReview,
  SignUpRequest,
  SignUpResult,
  TodayRecommendation,
  TodaySurvey,
  TodayWeather,
  UpsertSurveyPayload,
  WeeklyRecommendationItem
} from "./types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080";

export class ApiRequestError extends Error {
  status: number;
  code?: string;

  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = "ApiRequestError";
    this.status = status;
    this.code = code;
  }
}

type RequestOptions = {
  method?: "GET" | "POST";
  token?: string;
  body?: unknown;
};

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const method = options.method ?? "GET";
  const headers: Record<string, string> = {
    "Content-Type": "application/json"
  };
  if (options.token) {
    headers.Authorization = `Bearer ${options.token}`;
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
    cache: "no-store"
  });

  let payload: ApiResponse<T> | null = null;
  try {
    payload = (await response.json()) as ApiResponse<T>;
  } catch {
    payload = null;
  }

  if (!response.ok || !payload?.success || !payload.data) {
    const message = payload?.error?.message ?? "API 요청에 실패했습니다.";
    const code = payload?.error?.code;
    throw new ApiRequestError(message, response.status, code);
  }

  return payload.data;
}

export function fetchTodayWeather() {
  return request<TodayWeather>("/api/weather/today");
}

export function fetchTodayRecommendation(gender: Gender) {
  return request<TodayRecommendation>(`/api/recommendations/today?gender=${gender}`);
}

export function fetchTodayMemberRecommendation(token: string) {
  return request<TodayRecommendation>("/api/recommendations/member/today", { token });
}

export function fetchWeeklyRecommendations(token: string) {
  return request<WeeklyRecommendationItem[]>("/api/recommendations/weekly", { token });
}

export function fetchTodaySurvey(token: string) {
  return request<TodaySurvey>("/api/surveys/today", { token });
}

export function upsertTodaySurvey(token: string, payload: UpsertSurveyPayload) {
  return request<TodaySurvey>("/api/surveys", {
    method: "POST",
    token,
    body: payload
  });
}

export function login(payload: LoginRequest) {
  return request<LoginResult>("/api/auth/login", {
    method: "POST",
    body: payload
  });
}

export function signUp(payload: SignUpRequest) {
  return request<SignUpResult>("/api/auth/signup", {
    method: "POST",
    body: payload
  });
}

export async function createOotdReview(token: string, payload: CreateOotdReviewPayload) {
  const formData = new FormData();
  if (payload.reviewDate) {
    formData.append("reviewDate", payload.reviewDate);
  }
  if (payload.notes && payload.notes.trim().length > 0) {
    formData.append("notes", payload.notes.trim());
  }
  payload.images.forEach((image) => formData.append("images", image));

  const response = await fetch(`${API_BASE_URL}/api/ootd-reviews`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`
    },
    body: formData,
    cache: "no-store"
  });

  let apiPayload: ApiResponse<OotdReview> | null = null;
  try {
    apiPayload = (await response.json()) as ApiResponse<OotdReview>;
  } catch {
    apiPayload = null;
  }

  if (!response.ok || !apiPayload?.success || !apiPayload.data) {
    const message = apiPayload?.error?.message ?? "API 요청에 실패했습니다.";
    const code = apiPayload?.error?.code;
    throw new ApiRequestError(message, response.status, code);
  }

  return apiPayload.data;
}

export function fetchOotdReviews(token: string) {
  return request<OotdReview[]>("/api/ootd-reviews", { token });
}

export function fetchOotdReviewDetail(token: string, id: number) {
  return request<OotdReview>(`/api/ootd-reviews/${id}`, { token });
}
