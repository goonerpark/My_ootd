export type Gender = "MALE" | "FEMALE";
export type OutingPurpose =
  | "WORK"
  | "SCHOOL"
  | "DATE"
  | "EXERCISE"
  | "FORMAL"
  | "TRAVEL"
  | "CASUAL"
  | "QUICK_OUTING";

export type ApiError = {
  code: string;
  message: string;
};

export type ApiResponse<T> = {
  success: boolean;
  data?: T;
  error?: ApiError;
};

export type LoginRequest = {
  email: string;
  password: string;
};

export type LoginResult = {
  accessToken: string;
  tokenType: string;
  expiresIn: number;
  userId: number;
  email: string;
  nickname: string;
};

export type SignUpRequest = {
  email: string;
  password: string;
  nickname: string;
  gender: Gender;
};

export type SignUpResult = {
  userId: number;
  email: string;
  nickname: string;
  gender: Gender;
  role: "USER" | "ADMIN";
  createdAt: string;
};

export type TodayWeather = {
  targetDate: string;
  regionCode: string;
  weatherMain: string;
  weatherDescription: string;
  precipitationProbability: number;
  minTemp: number;
  maxTemp: number;
  currentTemp: number;
  humidity: number;
  fetchedAt: string;
};

export type TodayRecommendation = {
  recommendationId: number;
  userId: number | null;
  targetDate: string;
  gender: Gender;
  topItem: string | null;
  outerItem: string | null;
  bottomItem: string | null;
  shoesItem: string | null;
  accessoryItem: string | null;
  summaryComment: string | null;
  weather: TodayWeather;
};

export type TodaySurvey = {
  surveyId: number;
  userId: number;
  surveyDate: string;
  outingPurpose: OutingPurpose;
  notes: string | null;
  createdAt: string;
};

export type UpsertSurveyPayload = {
  outingPurpose: OutingPurpose;
  notes?: string;
};

export type WeeklyRecommendationWeather = {
  weatherMain: string;
  weatherDescription: string;
  minTemp: number;
  maxTemp: number;
  currentTemp: number;
  precipitationProbability: number;
  humidity: number;
};

export type WeeklyRecommendationOutfit = {
  top: string;
  outer: string;
  bottom: string;
  shoes: string;
  accessory: string;
  comment: string;
};

export type WeeklyRecommendationItem = {
  targetDate: string;
  weather: WeeklyRecommendationWeather;
  recommendation: WeeklyRecommendationOutfit;
};
