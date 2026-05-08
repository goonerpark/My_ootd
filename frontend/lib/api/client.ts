import type {
  ApiResponse,
  ClosetItem,
  CreateOotdPostPayload,
  TodayClosetRecommendation,
  CreateOotdReviewPayload,
  Gender,
  LikeToggleResult,
  LoginRequest,
  LoginResult,
  LookCategory,
  OotdClosetSuggestionsResult,
  OotdComment,
  OotdPostDetail,
  OotdPostSummary,
  OotdReview,
  PageResponse,
  RecommendationHistoryItem,
  SignUpRequest,
  SignUpResult,
  TodayRecommendation,
  TodaySurvey,
  TodayWeather,
  UpsertClosetItemPayload,
  UpsertSurveyPayload,
  UpdateOotdPostPayload,
  UpdateUserProfilePayload,
  UserProfile,
  WeeklyRecommendationItem
} from "./types";
import { clearAccessTokenFromStorage } from "@/lib/auth/token";

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
  method?: "GET" | "POST" | "PUT" | "DELETE";
  token?: string;
  body?: unknown;
};

function clearStoredAuthOnUnauthorized(response: Response) {
  if (response.status === 401 && typeof window !== "undefined") {
    clearAccessTokenFromStorage();
  }
}

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
    clearStoredAuthOnUnauthorized(response);
    const message = payload?.error?.message ?? "API 요청에 실패했습니다.";
    const code = payload?.error?.code;
    throw new ApiRequestError(message, response.status, code);
  }

  return payload.data;
}

async function requestVoid(path: string, options: RequestOptions = {}): Promise<void> {
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

  let payload: ApiResponse<unknown> | null = null;
  try {
    payload = (await response.json()) as ApiResponse<unknown>;
  } catch {
    payload = null;
  }

  if (!response.ok || !payload?.success) {
    clearStoredAuthOnUnauthorized(response);
    const message = payload?.error?.message ?? "API 요청에 실패했습니다.";
    const code = payload?.error?.code;
    throw new ApiRequestError(message, response.status, code);
  }
}

export function fetchTodayWeather(params: { regionCode?: string; lat?: number; lon?: number; targetDate?: string; startHour?: string; endHour?: string } = {}) {
  const search = new URLSearchParams();
  if (params.regionCode) search.set("regionCode", params.regionCode);
  if (typeof params.lat === "number") search.set("lat", String(params.lat));
  if (typeof params.lon === "number") search.set("lon", String(params.lon));
  if (params.targetDate) search.set("targetDate", params.targetDate);
  if (params.startHour) search.set("startHour", params.startHour);
  if (params.endHour) search.set("endHour", params.endHour);
  const query = search.toString();
  return request<TodayWeather>(`/api/weather/today${query ? `?${query}` : ""}`);
}

export function fetchMyProfile(token: string) {
  return request<UserProfile>("/api/users/me/profile", { token });
}

export function updateMyProfile(token: string, payload: UpdateUserProfilePayload) {
  return request<UserProfile>("/api/users/me/profile", {
    method: "PUT",
    token,
    body: payload
  });
}

export function fetchTodayRecommendation(gender: Gender) {
  return request<TodayRecommendation>(`/api/recommendations/today?gender=${gender}`);
}

export function fetchTodayMemberRecommendation(token: string, gender?: Gender) {
  const query = gender ? `?gender=${gender}` : "";
  return request<TodayRecommendation>(`/api/recommendations/member/today${query}`, { token });
}

export function fetchTodayClosetRecommendation(token: string) {
  return request<TodayClosetRecommendation>("/api/recommendations/today/closet", { token });
}

export function fetchWeeklyRecommendations(token: string) {
  return request<WeeklyRecommendationItem[]>("/api/recommendations/weekly", { token });
}

export function fetchRecommendationHistory(token: string) {
  return request<RecommendationHistoryItem[]>("/api/recommendations/history", { token });
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
    clearStoredAuthOnUnauthorized(response);
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

export function fetchOotdClosetSuggestions(token: string, reviewId: number) {
  return request<OotdClosetSuggestionsResult>(`/api/ootd-reviews/${reviewId}/closet-suggestions`, { token });
}

function buildClosetFormData(payload: UpsertClosetItemPayload) {
  const formData = new FormData();
  formData.append("category", payload.category);
  if (payload.subcategory && payload.subcategory.trim().length > 0) {
    formData.append("subcategory", payload.subcategory.trim());
  }
  if (payload.color && payload.color.trim().length > 0) {
    formData.append("color", payload.color.trim());
  }
  if (payload.season) {
    formData.append("season", payload.season);
  }
  if (payload.thickness) {
    formData.append("thickness", payload.thickness);
  }
  if (payload.fit) {
    formData.append("fit", payload.fit);
  }
  if (payload.brand && payload.brand.trim().length > 0) {
    formData.append("brand", payload.brand.trim());
  }
  if (payload.memo && payload.memo.trim().length > 0) {
    formData.append("memo", payload.memo.trim());
  }
  if (payload.imageUrl && payload.imageUrl.trim().length > 0) {
    formData.append("imageUrl", payload.imageUrl.trim());
  }
  if (payload.imageFile) {
    formData.append("imageFile", payload.imageFile);
  }
  return formData;
}

async function requestClosetWithFormData(
  path: string,
  method: "POST" | "PUT",
  token: string,
  payload: UpsertClosetItemPayload
) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`
    },
    body: buildClosetFormData(payload),
    cache: "no-store"
  });

  let apiPayload: ApiResponse<ClosetItem> | null = null;
  try {
    apiPayload = (await response.json()) as ApiResponse<ClosetItem>;
  } catch {
    apiPayload = null;
  }

  if (!response.ok || !apiPayload?.success || !apiPayload.data) {
    clearStoredAuthOnUnauthorized(response);
    const message = apiPayload?.error?.message ?? "API 요청에 실패했습니다.";
    const code = apiPayload?.error?.code;
    throw new ApiRequestError(message, response.status, code);
  }

  return apiPayload.data;
}

export function fetchClosetItems(token: string) {
  return request<ClosetItem[]>("/api/closet-items", { token });
}

export function fetchClosetItemDetail(token: string, id: number) {
  return request<ClosetItem>(`/api/closet-items/${id}`, { token });
}

export function createClosetItem(token: string, payload: UpsertClosetItemPayload) {
  return requestClosetWithFormData("/api/closet-items", "POST", token, payload);
}

export function updateClosetItem(token: string, id: number, payload: UpsertClosetItemPayload) {
  return requestClosetWithFormData(`/api/closet-items/${id}`, "PUT", token, payload);
}

export function deleteClosetItem(token: string, id: number) {
  return requestVoid(`/api/closet-items/${id}`, { method: "DELETE", token });
}

export function fetchOotdPosts(params: { page?: number; size?: number; lookCategory?: LookCategory; hashtag?: string } = {}) {
  const search = new URLSearchParams();
  search.set("page", String(params.page ?? 0));
  search.set("size", String(params.size ?? 20));
  if (params.lookCategory) search.set("lookCategory", params.lookCategory);
  if (params.hashtag) search.set("hashtag", params.hashtag);
  return request<PageResponse<OotdPostSummary>>(`/api/ootd-posts?${search.toString()}`);
}

export function fetchOutfitInspirations(params: { page?: number; size?: number; lookCategory?: LookCategory } = {}) {
  const search = new URLSearchParams();
  search.set("page", String(params.page ?? 0));
  search.set("size", String(params.size ?? 20));
  if (params.lookCategory) search.set("lookCategory", params.lookCategory);
  return request<PageResponse<OotdPostSummary>>(`/api/outfit-inspirations?${search.toString()}`);
}

export function fetchOotdPostsByHashtag(hashtagName: string, params: { page?: number; size?: number } = {}) {
  const search = new URLSearchParams();
  search.set("page", String(params.page ?? 0));
  search.set("size", String(params.size ?? 20));
  return request<PageResponse<OotdPostSummary>>(`/api/ootd-posts/hashtags/${encodeURIComponent(hashtagName)}?${search.toString()}`);
}

export function fetchOotdPostDetail(id: number, token?: string | null) {
  return request<OotdPostDetail>(`/api/ootd-posts/${id}`, token ? { token } : {});
}

export async function createOotdPost(token: string, payload: CreateOotdPostPayload) {
  const formData = new FormData();
  payload.images.forEach((image) => formData.append("images", image));
  formData.append("caption", payload.caption);
  formData.append("lookCategory", payload.lookCategory);
  payload.hashtags.forEach((hashtag) => formData.append("hashtags", hashtag));
  if (payload.brandTagsJson) {
    formData.append("brandTagsJson", payload.brandTagsJson);
  }

  const response = await fetch(`${API_BASE_URL}/api/ootd-posts`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`
    },
    body: formData,
    cache: "no-store"
  });

  let apiPayload: ApiResponse<OotdPostDetail> | null = null;
  try {
    apiPayload = (await response.json()) as ApiResponse<OotdPostDetail>;
  } catch {
    apiPayload = null;
  }

  if (!response.ok || !apiPayload?.success || !apiPayload.data) {
    clearStoredAuthOnUnauthorized(response);
    const message = apiPayload?.error?.message ?? "API 요청에 실패했습니다.";
    const code = apiPayload?.error?.code;
    throw new ApiRequestError(message, response.status, code);
  }

  return apiPayload.data;
}

export async function updateOotdPost(token: string, id: number, payload: UpdateOotdPostPayload) {
  const formData = new FormData();
  payload.images?.forEach((image) => formData.append("images", image));
  formData.append("caption", payload.caption);
  formData.append("lookCategory", payload.lookCategory);
  payload.hashtags.forEach((hashtag) => formData.append("hashtags", hashtag));
  if (payload.brandTagsJson) {
    formData.append("brandTagsJson", payload.brandTagsJson);
  }

  const response = await fetch(`${API_BASE_URL}/api/ootd-posts/${id}`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`
    },
    body: formData,
    cache: "no-store"
  });

  let apiPayload: ApiResponse<OotdPostDetail> | null = null;
  try {
    apiPayload = (await response.json()) as ApiResponse<OotdPostDetail>;
  } catch {
    apiPayload = null;
  }

  if (!response.ok || !apiPayload?.success || !apiPayload.data) {
    clearStoredAuthOnUnauthorized(response);
    const message = apiPayload?.error?.message ?? "API 요청에 실패했습니다.";
    const code = apiPayload?.error?.code;
    throw new ApiRequestError(message, response.status, code);
  }

  return apiPayload.data;
}

export function deleteOotdPost(token: string, id: number) {
  return requestVoid(`/api/ootd-posts/${id}`, { method: "DELETE", token });
}

export function toggleOotdPostLike(token: string, id: number) {
  return request<LikeToggleResult>(`/api/ootd-posts/${id}/likes`, { method: "POST", token });
}

export function createOotdPostComment(token: string, id: number, content: string, parentCommentId?: number | null) {
  return request<OotdComment>(`/api/ootd-posts/${id}/comments`, {
    method: "POST",
    token,
    body: { content, parentCommentId: parentCommentId ?? null }
  });
}

export function deleteOotdPostComment(token: string, id: number) {
  return requestVoid(`/api/ootd-comments/${id}`, { method: "DELETE", token });
}
