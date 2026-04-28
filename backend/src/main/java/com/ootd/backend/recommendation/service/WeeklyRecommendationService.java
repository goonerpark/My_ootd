package com.ootd.backend.recommendation.service;

import com.ootd.backend.ai.dto.AiRecommendationResult;
import com.ootd.backend.ai.service.GeminiWeeklyRecommendationService;
import com.ootd.backend.recommendation.dto.WeeklyOutfitRecommendationResponse;
import com.ootd.backend.recommendation.dto.WeeklyRecommendationResponse;
import com.ootd.backend.recommendation.dto.WeeklyWeatherResponse;
import com.ootd.backend.recommendation.entity.DailyRecommendation;
import com.ootd.backend.recommendation.entity.RecommendationType;
import com.ootd.backend.recommendation.repository.DailyRecommendationRepository;
import com.ootd.backend.survey.entity.SurveyAnswer;
import com.ootd.backend.survey.service.SurveyService;
import com.ootd.backend.user.entity.Gender;
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
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Objects;

@Service
@RequiredArgsConstructor
public class WeeklyRecommendationService {

    private static final int WEEKLY_RECOMMENDATION_DAYS = 7;

    private final WeatherQueryService weatherQueryService;
    private final UserRepository userRepository;
    private final UserProfileRepository userProfileRepository;
    private final SurveyService surveyService;
    private final DailyRecommendationRepository dailyRecommendationRepository;
    private final GeminiWeeklyRecommendationService geminiWeeklyRecommendationService;

    @Transactional
    public List<WeeklyRecommendationResponse> getWeeklyRecommendations(Long userId) {
        User user = userRepository.findById(Objects.requireNonNull(userId))
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        UserProfile profile = userProfileRepository.findByUserId(userId).orElse(null);
        SurveyAnswer todaySurvey = surveyService.findTodaySurveyOrNull(userId);

        List<WeatherCache> weatherCaches = weatherQueryService.getOrFetchWeatherCaches(
                LocalDate.now(),
                WEEKLY_RECOMMENDATION_DAYS
        );
        Map<LocalDate, AiRecommendationResult> geminiRecommendations =
                geminiWeeklyRecommendationService.recommendWeekly(weatherCaches, user, profile, todaySurvey);

        List<WeeklyRecommendationResponse> responses = new ArrayList<>();
        for (WeatherCache weatherCache : weatherCaches) {
            WeeklyDraft draft = buildDraft(
                    weatherCache,
                    user.getGender(),
                    geminiRecommendations.get(weatherCache.getTargetDate())
            );
            saveDailyRecommendation(userId, user.getGender(), weatherCache, draft);
            responses.add(toResponse(weatherCache, draft));
        }

        return responses;
    }

    private WeeklyDraft buildDraft(WeatherCache weatherCache, Gender gender, AiRecommendationResult aiResult) {
        if (aiResult == null) {
            return buildWeatherBasedFallback(weatherCache, gender);
        }
        return new WeeklyDraft(
                sanitize(aiResult.top()),
                sanitize(aiResult.outer()),
                sanitize(aiResult.bottom()),
                sanitize(aiResult.shoes()),
                sanitize(aiResult.accessory()),
                sanitize(aiResult.comment())
        );
    }

    private void saveDailyRecommendation(Long userId, Gender gender, WeatherCache weatherCache, WeeklyDraft draft) {
        DailyRecommendation recommendation = DailyRecommendation.builder()
                .userId(userId)
                .targetDate(weatherCache.getTargetDate())
                .gender(gender)
                .weatherCacheId(weatherCache.getId())
                .recommendationType(RecommendationType.MEMBER_SURVEY)
                .topItem(draft.top())
                .outerItem(draft.outer())
                .bottomItem(draft.bottom())
                .shoesItem(draft.shoes())
                .accessoryItem(draft.accessory())
                .summaryComment(draft.comment())
                .build();
        dailyRecommendationRepository.save(Objects.requireNonNull(recommendation));
    }

    private WeeklyRecommendationResponse toResponse(WeatherCache weatherCache, WeeklyDraft draft) {
        TodayWeatherResponse normalized = weatherQueryService.toResponse(weatherCache);
        WeeklyWeatherResponse weather = new WeeklyWeatherResponse(
                normalized.weatherMain(),
                normalized.weatherDescription(),
                normalized.minTemp(),
                normalized.maxTemp(),
                normalized.currentTemp(),
                normalized.precipitationProbability(),
                normalized.humidity()
        );

        WeeklyOutfitRecommendationResponse recommendation = new WeeklyOutfitRecommendationResponse(
                draft.top(),
                draft.outer(),
                draft.bottom(),
                draft.shoes(),
                draft.accessory(),
                draft.comment()
        );

        return new WeeklyRecommendationResponse(
                weatherCache.getTargetDate(),
                weather,
                recommendation
        );
    }

    private String sanitize(String value) {
        if (value == null || value.isBlank()) {
            return "없음";
        }
        return value.trim();
    }

    private WeeklyDraft buildWeatherBasedFallback(WeatherCache weather, Gender gender) {
        BigDecimal min = weather.getMinTemp();
        BigDecimal max = weather.getMaxTemp();
        BigDecimal current = weather.getCurrentTemp() == null
                ? min.add(max).divide(BigDecimal.valueOf(2), 2, RoundingMode.HALF_UP)
                : weather.getCurrentTemp();

        BigDecimal gap = max.subtract(min);
        boolean hot = max.compareTo(BigDecimal.valueOf(25)) >= 0 || current.compareTo(BigDecimal.valueOf(24)) >= 0;
        boolean mild = max.compareTo(BigDecimal.valueOf(20)) >= 0 || current.compareTo(BigDecimal.valueOf(17)) >= 0;
        boolean chilly = max.compareTo(BigDecimal.valueOf(14)) >= 0 || current.compareTo(BigDecimal.valueOf(12)) >= 0;
        boolean largeGap = gap.compareTo(BigDecimal.valueOf(10)) >= 0;
        boolean rainy = weather.getPrecipitationProbability() != null
                && weather.getPrecipitationProbability().compareTo(BigDecimal.valueOf(40)) >= 0;

        String top;
        String outer;
        String bottom;
        String shoes;
        String accessory;
        String comment;

        if (hot) {
            top = gender == Gender.MALE ? "레귤러 핏의 화이트 반팔 티셔츠" : "레귤러 핏의 아이보리 반팔 블라우스";
            outer = "없음";
            bottom = gender == Gender.MALE ? "스트레이트 핏의 베이지 코튼 쇼츠" : "와이드 핏의 라이트 베이지 팬츠";
            shoes = rainy ? "생활 방수 기능의 화이트 스니커즈" : "통기성 좋은 화이트 스니커즈";
            accessory = "블랙 캡 또는 선글라스";
            comment = "Gemini 호출이 실패해 날씨 규칙으로 대체 추천했습니다. 더운 날씨라 가볍고 통기성 좋은 소재를 우선했습니다.";
        } else if (mild) {
            top = "레귤러 핏의 크림 긴팔 티셔츠";
            outer = largeGap ? "가벼운 네이비 바람막이" : "라이트 그레이 셔츠 재킷";
            bottom = "세미 와이드핏의 연청 데님 팬츠";
            shoes = rainy ? "생활 방수 기능의 블랙 로퍼" : "블랙 로퍼";
            accessory = "실버 팔찌 또는 없음";
            comment = "Gemini 호출이 실패해 날씨 규칙으로 대체 추천했습니다. 활동하기 좋은 기온이라 가벼운 레이어링을 반영했습니다.";
        } else if (chilly) {
            top = "레귤러 핏의 차콜 니트";
            outer = "스탠다드 핏의 네이비 재킷";
            bottom = "스트레이트 핏의 블랙 코튼 팬츠";
            shoes = rainy ? "방수 기능의 블랙 첼시 부츠" : "블랙 로퍼";
            accessory = "얇은 그레이 머플러";
            comment = "Gemini 호출이 실패해 날씨 규칙으로 대체 추천했습니다. 쌀쌀한 날씨라 보온성과 활동성을 함께 고려했습니다.";
        } else {
            top = "레귤러 핏의 아이보리 기모 니트";
            outer = "오버 핏의 다크 그레이 코트";
            bottom = "스트레이트 핏의 블랙 기모 팬츠";
            shoes = rainy ? "방수 기능의 블랙 부츠" : "블랙 첼시 부츠";
            accessory = "울 머플러";
            comment = "Gemini 호출이 실패해 날씨 규칙으로 대체 추천했습니다. 낮은 기온에 맞춰 보온 중심으로 구성했습니다.";
        }

        if (largeGap && !"없음".equals(outer)) {
            comment = comment + " 일교차가 커서 얇은 아우터를 챙기는 편이 좋습니다.";
        }
        if (rainy) {
            comment = comment + " 강수 가능성이 있어 신발과 아우터의 방수성도 고려했습니다.";
        }

        return new WeeklyDraft(top, outer, bottom, shoes, accessory, comment);
    }

    private record WeeklyDraft(
            String top,
            String outer,
            String bottom,
            String shoes,
            String accessory,
            String comment
    ) {
    }
}
