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
  gender: Gender;
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


export type PersonalColor = "SPRING_WARM" | "SUMMER_COOL" | "AUTUMN_WARM" | "WINTER_COOL" | "UNKNOWN";
export type BodyType = "SLIM" | "NORMAL" | "MUSCULAR" | "CHUBBY" | "UNKNOWN";

export type UserProfile = {
  userId: number;
  email: string;
  nickname: string;
  gender: Gender;
  personalColor: PersonalColor;
  bodyType: BodyType;
  heightCm: number | null;
  weightKg: number | null;
  preferredStyle: string | null;
  profileImageUrl: string | null;
};

export type UpdateUserProfilePayload = {
  personalColor: PersonalColor;
  bodyType: BodyType;
  heightCm?: number | null;
  weightKg?: number | null;
  preferredStyle?: string | null;
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

export type RecommendationHistoryItem = {
  recommendationId: number;
  targetDate: string;
  gender: Gender;
  topItem: string | null;
  outerItem: string | null;
  bottomItem: string | null;
  shoesItem: string | null;
  accessoryItem: string | null;
  summaryComment: string | null;
  createdAt: string;
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

export type OotdReview = {
  id: number;
  userId: number;
  reviewDate: string;
  rating: number;
  fitFeedback: string | null;
  colorFeedback: string | null;
  overallFeedback: string | null;
  aiModelVersion: string | null;
  createdAt: string;
  imageUrls: string[];
};

export type CreateOotdReviewPayload = {
  reviewDate?: string;
  notes?: string;
  images: File[];
};

export type OotdClosetSuggestion = {
  slot?: "TOP" | "OUTER" | "BOTTOM" | "SHOES" | "ACCESSORY";
  closetItemId: number;
  category: "TOP" | "OUTER" | "BOTTOM" | "SHOES" | "ACCESSORY";
  color?: string | null;
  season?: "SPRING" | "SUMMER" | "AUTUMN" | "WINTER" | "ALL" | null;
  thickness?: "THIN" | "NORMAL" | "THICK" | null;
  fit?: "SLIM" | "REGULAR" | "OVER" | "WIDE" | "UNKNOWN" | null;
  brand?: string | null;
  imageUrl?: string | null;
  memo?: string | null;
  reason: string;
};

export type OotdClosetSuggestionsResult = {
  message: string;
  suggestions: OotdClosetSuggestion[];
};

export type ClosetCategory = "TOP" | "OUTER" | "BOTTOM" | "SHOES" | "ACCESSORY";
export type ClosetSeason = "SPRING" | "SUMMER" | "AUTUMN" | "WINTER" | "ALL";
export type ClosetThickness = "THIN" | "NORMAL" | "THICK";
export type ClosetFit = "SLIM" | "REGULAR" | "OVER" | "WIDE" | "UNKNOWN";

export type ClosetItem = {
  id: number;
  userId: number;
  category: ClosetCategory;
  subcategory: string | null;
  color: string | null;
  season: ClosetSeason;
  thickness: ClosetThickness;
  fit: ClosetFit;
  brand: string | null;
  imageUrl: string;
  memo: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type UpsertClosetItemPayload = {
  category: ClosetCategory;
  subcategory?: string;
  color?: string;
  season?: ClosetSeason;
  thickness?: ClosetThickness;
  fit?: ClosetFit;
  brand?: string;
  memo?: string;
  imageUrl?: string;
  imageFile?: File | null;
};

export type RecommendationSlot = "TOP" | "OUTER" | "BOTTOM" | "SHOES" | "ACCESSORY";

export type ClosetRecommendedItem = {
  slot: RecommendationSlot;
  closetItemId: number;
  category: ClosetCategory;
  subcategory: string | null;
  color: string | null;
  season: ClosetSeason;
  thickness: ClosetThickness;
  fit: ClosetFit;
  brand: string | null;
  imageUrl: string;
  memo: string | null;
  reason: string;
};

export type TodayClosetRecommendation = {
  targetDate: string;
  recommendationType: "MEMBER_CLOSET";
  weather: TodayWeather;
  top: string;
  outer: string;
  bottom: string;
  shoes: string;
  accessory: string;
  summaryComment: string;
  closetItems: ClosetRecommendedItem[];
};

export type LookCategory =
  | "DAILY"
  | "CASUAL"
  | "STREET"
  | "MINIMAL"
  | "FORMAL"
  | "WORK"
  | "DATE"
  | "TRAVEL"
  | "SPORTY"
  | "ETC";

export type PageResponse<T> = {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
  first: boolean;
  last: boolean;
};

export type OotdPostSummary = {
  postId: number;
  thumbnailUrl: string | null;
  hasMultipleImages: boolean;
  likeCount: number;
  viewCount: number;
  createdAt: string;
  authorNickname: string;
  authorProfileImageUrl: string | null;
  lookCategory: LookCategory;
};

export type OotdBrandTag = {
  brandTagId: number;
  brandName: string;
  shopUrl: string | null;
  positionX: number;
  positionY: number;
};

export type OotdPostImage = {
  imageId: number;
  imageUrl: string;
  imageOrder: number;
  brandTags: OotdBrandTag[];
};

export type OotdComment = {
  commentId: number;
  content: string;
  createdAt: string;
  authorId: number;
  authorNickname: string;
  authorProfileImageUrl: string | null;
};

export type OotdPostDetail = {
  postId: number;
  caption: string;
  lookCategory: LookCategory;
  images: OotdPostImage[];
  hashtags: string[];
  likeCount: number;
  viewCount: number;
  createdAt: string;
  authorId: number;
  authorNickname: string;
  authorProfileImageUrl: string | null;
  comments: OotdComment[];
};

export type CreateOotdPostPayload = {
  images: File[];
  caption: string;
  lookCategory: LookCategory;
  hashtags: string[];
  brandTagsJson?: string;
};

export type LikeToggleResult = {
  postId: number;
  liked: boolean;
  likeCount: number;
};
