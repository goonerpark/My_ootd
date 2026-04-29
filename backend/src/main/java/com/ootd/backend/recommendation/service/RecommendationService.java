package com.ootd.backend.recommendation.service;

import com.ootd.backend.ai.dto.AiRecommendationResult;
import com.ootd.backend.ai.service.GeminiRecommendationService;
import com.ootd.backend.recommendation.dto.TodayRecommendationResponse;
import com.ootd.backend.recommendation.entity.DailyRecommendation;
import com.ootd.backend.recommendation.entity.RecommendationType;
import com.ootd.backend.recommendation.repository.DailyRecommendationRepository;
import com.ootd.backend.recommendation.service.dto.CachedRecommendation;
import com.ootd.backend.recommendation.service.dto.RecommendationDraft;
import com.ootd.backend.survey.entity.OutingPurpose;
import com.ootd.backend.survey.entity.SurveyAnswer;
import com.ootd.backend.survey.service.SurveyService;
import com.ootd.backend.user.entity.BodyType;
import com.ootd.backend.user.entity.Gender;
import com.ootd.backend.user.entity.PersonalColor;
import com.ootd.backend.user.entity.User;
import com.ootd.backend.user.entity.UserProfile;
import com.ootd.backend.user.repository.UserProfileRepository;
import com.ootd.backend.user.repository.UserRepository;
import com.ootd.backend.weather.dto.TodayWeatherResponse;
import com.ootd.backend.weather.entity.WeatherCache;
import com.ootd.backend.weather.service.WeatherQueryService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class RecommendationService {

    private final WeatherQueryService weatherQueryService;
    private final DailyRecommendationRepository dailyRecommendationRepository;
    private final UserRepository userRepository;
    private final UserProfileRepository userProfileRepository;
    private final SurveyService surveyService;
    private final GeminiRecommendationService geminiRecommendationService;
    private final RecommendationAiCacheService recommendationAiCacheService;

    @Transactional
    public TodayRecommendationResponse getTodayRecommendation(Gender gender, Long userId) {
        WeatherCache weatherCache = weatherQueryService.getOrFetchTodayWeatherCache();
        CachedRecommendation cached = recommendationAiCacheService.getGuestRecommendation(
                weatherCache,
                gender,
                fallbackGender -> buildDraft(weatherCache, fallbackGender)
        );
        return buildCachedResponse(cached.cacheId(), null, gender, weatherCache, cached.draft());
    }

    @Transactional
    public TodayRecommendationResponse getTodayMemberRecommendation(Long userId) {
        return getTodayMemberRecommendation(userId, null);
    }

    @Transactional
    public TodayRecommendationResponse getTodayMemberRecommendation(Long userId, Gender requestedGender) {
        User user = userRepository.findById(Objects.requireNonNull(userId))
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        WeatherCache weatherCache = weatherQueryService.getOrFetchTodayWeatherCache();
        Gender effectiveGender = requestedGender == null ? user.getGender() : requestedGender;

        if (effectiveGender != user.getGender()) {
            CachedRecommendation guestCached = recommendationAiCacheService.getGuestRecommendation(
                    weatherCache,
                    effectiveGender,
                    fallbackGender -> buildDraft(weatherCache, fallbackGender)
            );
            return buildCachedResponse(guestCached.cacheId(), null, effectiveGender, weatherCache, guestCached.draft());
        }

        RecommendationDraft baseDraft = buildDraft(weatherCache, user.getGender());

        SurveyAnswer todaySurvey = surveyService.findTodaySurveyOrNull(userId);
        UserProfile profile = userProfileRepository.findByUserId(userId).orElse(null);

        RecommendationDraft adjusted = applyMemberAdjustments(baseDraft, todaySurvey, profile);
        CachedRecommendation cached = recommendationAiCacheService.getUserRecommendation(weatherCache, user, profile, todaySurvey, adjusted);

        return buildCachedResponse(cached.cacheId(), userId, user.getGender(), weatherCache, cached.draft());
    }

    private TodayRecommendationResponse saveAndBuildResponse(
            Long userId,
            Gender gender,
            WeatherCache weatherCache,
            RecommendationDraft draft,
            RecommendationType type
    ) {
        DailyRecommendation recommendation = DailyRecommendation.builder()
                        .userId(userId)
                        .targetDate(weatherCache.getTargetDate())
                        .gender(gender)
                        .weatherCacheId(weatherCache.getId())
                        .recommendationType(type)
                        .topItem(draft.topItem())
                        .outerItem(draft.outerItem())
                        .bottomItem(draft.bottomItem())
                        .shoesItem(draft.shoesItem())
                        .accessoryItem(draft.accessoryItem())
                        .summaryComment(draft.summaryComment())
                        .build();
        DailyRecommendation saved = dailyRecommendationRepository.save(Objects.requireNonNull(recommendation));

        TodayWeatherResponse weather = weatherQueryService.toResponse(weatherCache);
        return new TodayRecommendationResponse(
                saved.getId(),
                saved.getUserId(),
                saved.getTargetDate(),
                saved.getGender(),
                saved.getTopItem(),
                saved.getOuterItem(),
                saved.getBottomItem(),
                saved.getShoesItem(),
                saved.getAccessoryItem(),
                saved.getSummaryComment(),
                weather
        );
    }

    private TodayRecommendationResponse buildCachedResponse(
            Long recommendationId,
            Long userId,
            Gender gender,
            WeatherCache weatherCache,
            RecommendationDraft draft
    ) {
        TodayWeatherResponse weather = weatherQueryService.toResponse(weatherCache);
        return new TodayRecommendationResponse(
                recommendationId,
                userId,
                weatherCache.getTargetDate(),
                gender,
                draft.topItem(),
                draft.outerItem(),
                draft.bottomItem(),
                draft.shoesItem(),
                draft.accessoryItem(),
                draft.summaryComment(),
                weather
        );
    }

    private RecommendationDraft buildDraft(WeatherCache weather, Gender gender) {
        BigDecimal min = weather.getMinTemp();
        BigDecimal max = weather.getMaxTemp();
        BigDecimal current = weather.getCurrentTemp() != null
                ? weather.getCurrentTemp()
                : min.add(max).divide(BigDecimal.valueOf(2), 2, RoundingMode.HALF_UP);
        BigDecimal gap = max.subtract(min).setScale(2, RoundingMode.HALF_UP);

        boolean bigDailyRange = gap.compareTo(BigDecimal.valueOf(10)) >= 0;
        boolean transitionDay = min.compareTo(BigDecimal.valueOf(10)) < 0 && max.compareTo(BigDecimal.valueOf(20)) >= 0;

        String top;
        String outer;
        String bottom;
        String shoes;
        String accessory;
        String summary;

        if (max.compareTo(BigDecimal.valueOf(25)) >= 0 || current.compareTo(BigDecimal.valueOf(24)) >= 0) {
            top = gender == Gender.MALE ? "루즈핏 반팔 티셔츠" : "가벼운 반팔 블라우스";
            outer = "없음";
            bottom = gender == Gender.MALE ? "얇은 슬랙스 또는 반바지" : "가벼운 스커트 또는 반바지";
            shoes = "통기성 좋은 스니커즈";
            accessory = "선글라스";
            summary = "더운 날씨예요. 아우터 없이 가볍고 통기성 좋은 코디를 추천해요.";
        } else if (transitionDay || (bigDailyRange && max.compareTo(BigDecimal.valueOf(18)) >= 0)) {
            top = gender == Gender.MALE ? "레귤러핏 긴팔 티셔츠" : "얇은 니트 또는 긴팔 티셔츠";
            outer = "가벼운 자켓 또는 가디건";
            bottom = gender == Gender.MALE ? "청바지 또는 코튼 팬츠" : "청바지 또는 미디 스커트";
            shoes = "기본 스니커즈";
            accessory = "얇은 스카프";
            summary = "일교차가 큰 날이에요. 벗고 입기 쉬운 레이어드 코디를 추천해요.";
        } else if (max.compareTo(BigDecimal.valueOf(20)) >= 0 || current.compareTo(BigDecimal.valueOf(17)) >= 0) {
            top = "긴팔 티셔츠";
            outer = "얇은 가디건";
            bottom = "청바지";
            shoes = "스니커즈";
            accessory = "가벼운 숄더백";
            summary = "선선한 날씨예요. 가벼운 아우터를 챙기면 좋아요.";
        } else if (max.compareTo(BigDecimal.valueOf(14)) >= 0 || current.compareTo(BigDecimal.valueOf(12)) >= 0) {
            top = "니트 또는 맨투맨";
            outer = "자켓";
            bottom = "기모 없는 긴바지";
            shoes = "커버감 있는 스니커즈";
            accessory = "얇은 스카프";
            summary = "쌀쌀한 날씨예요. 자켓과 긴바지 조합을 추천해요.";
        } else {
            top = "기모 니트";
            outer = "코트 또는 두꺼운 아우터";
            bottom = "기모 팬츠";
            shoes = "보온성 있는 신발";
            accessory = "목도리 또는 장갑";
            summary = "추운 날씨예요. 보온 중심의 겨울 코디를 추천해요.";
        }

        if (bigDailyRange && !"없음".equals(outer) && !summary.contains("일교차")) {
            summary = summary + " 일교차가 커서 아우터를 함께 챙기면 좋아요.";
        }

        return new RecommendationDraft(top, outer, bottom, shoes, accessory, summary);
    }

    private RecommendationDraft applyMemberAdjustments(RecommendationDraft base, SurveyAnswer survey, UserProfile profile) {
        String top = base.topItem();
        String outer = base.outerItem();
        String bottom = base.bottomItem();
        String shoes = base.shoesItem();
        String accessory = base.accessoryItem();
        List<String> comments = new ArrayList<>();
        comments.add(base.summaryComment());

        if (survey != null && survey.getOutingPurpose() != null) {
            OutingPurpose purpose = survey.getOutingPurpose();
            switch (purpose) {
                case WORK -> {
                    outer = "단정한 자켓 또는 깔끔한 가디건";
                    shoes = "로퍼 또는 미니멀 스니커즈";
                    comments.add("출근 일정에는 단정하고 깔끔한 무드가 잘 맞아요.");
                }
                case SCHOOL -> {
                    top = "편한 맨투맨 또는 기본 티셔츠";
                    shoes = "쿠션감 좋은 스니커즈";
                    accessory = "백팩";
                    comments.add("등교 일정에는 편안하고 활동성 있는 스타일을 추천해요.");
                }
                case DATE -> {
                    top = "실루엣이 좋은 상의";
                    accessory = "포인트 액세서리";
                    comments.add("데이트 일정에는 핏과 컬러 포인트를 살려보세요.");
                }
                case EXERCISE -> {
                    top = "흡습성이 좋은 기능성 상의";
                    bottom = "스트레치 팬츠";
                    shoes = "러닝화 또는 트레이닝화";
                    comments.add("운동 일정에는 통기성과 활동성을 우선했어요.");
                }
                case FORMAL -> {
                    top = "셔츠 또는 단정한 상의";
                    outer = "블레이저 또는 코트";
                    shoes = "단정한 구두";
                    comments.add("격식 있는 자리에는 차분한 라인으로 맞춰보세요.");
                }
                case TRAVEL -> {
                    outer = "가벼운 바람막이 또는 레이어드 아우터";
                    shoes = "장시간 보행용 편한 신발";
                    accessory = "크로스백";
                    comments.add("여행 일정에는 체온 조절과 편안함을 함께 챙기세요.");
                }
                case CASUAL -> comments.add("가벼운 외출에는 부담 없는 데일리 코디가 좋아요.");
                case QUICK_OUTING -> {
                    top = "간편한 기본 상의";
                    shoes = "슬립온 또는 가벼운 스니커즈";
                    comments.add("잠깐 외출에는 빠르게 입기 좋은 조합을 추천해요.");
                }
            }

            if (survey.getNotes() != null && !survey.getNotes().isBlank()) {
                comments.add("요청 메모 반영: " + survey.getNotes());
            }
        }

        if (profile != null) {
            if (profile.getPersonalColor() != null && profile.getPersonalColor() != PersonalColor.UNKNOWN) {
                comments.add(personalColorComment(profile.getPersonalColor()));
            }
            if (profile.getBodyType() != null && profile.getBodyType() != BodyType.UNKNOWN) {
                comments.add(bodyTypeComment(profile.getBodyType()));
            }
        }

        String summary = String.join(" ", comments);
        if (summary.length() > 500) {
            summary = summary.substring(0, 500);
        }

        return new RecommendationDraft(top, outer, bottom, shoes, accessory, summary);
    }

    private String personalColorComment(PersonalColor personalColor) {
        return switch (personalColor) {
            case SPRING_WARM -> "봄 웜톤에는 크림, 피치, 밝은 베이지 계열이 잘 어울려요.";
            case SUMMER_COOL -> "여름 쿨톤에는 라벤더, 소프트 블루, 그레이 계열이 좋아요.";
            case AUTUMN_WARM -> "가을 웜톤에는 카멜, 브라운, 올리브 계열을 추천해요.";
            case WINTER_COOL -> "겨울 쿨톤에는 블랙, 네이비, 선명한 포인트 컬러가 잘 맞아요.";
            case UNKNOWN -> "";
        };
    }

    private String bodyTypeComment(BodyType bodyType) {
        return switch (bodyType) {
            case SLIM -> "슬림 체형은 과하지 않은 레이어드와 여유 있는 핏이 균형감 있어요.";
            case NORMAL -> "기본 핏을 중심으로 소재와 컬러 포인트를 주기 좋아요.";
            case MUSCULAR -> "근육형 체형은 자연스럽게 떨어지는 레귤러핏이 깔끔해요.";
            case CHUBBY -> "너무 타이트하지 않은 스트레이트 핏이 활동성과 실루엣에 좋아요.";
            case UNKNOWN -> "";
        };
    }

    private RecommendationDraft applyAiRecommendationOrFallback(
            RecommendationDraft fallbackDraft,
            WeatherCache weather,
            User user,
            UserProfile profile,
            SurveyAnswer survey
    ) {
        Optional<AiRecommendationResult> aiResult = geminiRecommendationService.recommend(weather, user, profile, survey);
        if (aiResult.isEmpty()) {
            return fallbackDraft;
        }

        AiRecommendationResult result = aiResult.get();
        return new RecommendationDraft(
                sanitize(result.top()),
                sanitize(result.outer()),
                sanitize(result.bottom()),
                sanitize(result.shoes()),
                sanitize(result.accessory()),
                sanitize(result.comment())
        );
    }

    private String sanitize(String value) {
        if (value == null || value.isBlank()) {
            return "없음";
        }
        return value.trim();
    }
}
