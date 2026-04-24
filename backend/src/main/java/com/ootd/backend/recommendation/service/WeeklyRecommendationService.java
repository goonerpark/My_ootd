package com.ootd.backend.recommendation.service;

import com.ootd.backend.recommendation.dto.WeeklyOutfitRecommendationResponse;
import com.ootd.backend.recommendation.dto.WeeklyRecommendationResponse;
import com.ootd.backend.recommendation.dto.WeeklyWeatherResponse;
import com.ootd.backend.recommendation.entity.DailyRecommendation;
import com.ootd.backend.recommendation.entity.RecommendationType;
import com.ootd.backend.recommendation.repository.DailyRecommendationRepository;
import com.ootd.backend.user.entity.Gender;
import com.ootd.backend.user.entity.User;
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

@Service
@RequiredArgsConstructor
public class WeeklyRecommendationService {

    private final WeatherQueryService weatherQueryService;
    private final UserRepository userRepository;
    private final DailyRecommendationRepository dailyRecommendationRepository;

    @Transactional
    public List<WeeklyRecommendationResponse> getWeeklyRecommendations(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        List<WeatherCache> weatherCaches = weatherQueryService.getOrFetchWeatherCaches(LocalDate.now(), 7);
        List<WeeklyRecommendationResponse> responses = new ArrayList<>();

        for (WeatherCache weatherCache : weatherCaches) {
            WeeklyDraft draft = buildDraft(weatherCache, user.getGender());
            saveDailyRecommendation(userId, user.getGender(), weatherCache, draft);
            responses.add(toResponse(weatherCache, draft));
        }

        return responses;
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
        dailyRecommendationRepository.save(recommendation);
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

    private WeeklyDraft buildDraft(WeatherCache weather, Gender gender) {
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
            top = gender == Gender.MALE ? "반팔 티셔츠" : "가벼운 반팔 블라우스";
            outer = "없음";
            bottom = gender == Gender.MALE ? "얇은 면 팬츠" : "가벼운 슬랙스";
            shoes = rainy ? "방수 스니커즈" : "통기성 좋은 스니커즈";
            accessory = "선글라스";
            comment = "더운 날씨로 아우터 없이 가볍게 입는 것을 추천합니다.";
        } else if (mild) {
            top = "긴팔 티셔츠";
            outer = largeGap ? "가벼운 자켓" : "얇은 가디건";
            bottom = "청바지";
            shoes = rainy ? "생활방수 로퍼" : "스니커즈";
            accessory = "크로스백";
            comment = "선선한 기온이라 얇은 레이어드 코디가 잘 어울립니다.";
        } else if (chilly) {
            top = "니트 또는 맨투맨";
            outer = "자켓";
            bottom = "코튼 팬츠";
            shoes = rainy ? "방수 워커" : "기본 로퍼";
            accessory = "얇은 머플러";
            comment = "쌀쌀한 날씨라 보온성과 활동성을 함께 챙기는 코디를 추천합니다.";
        } else {
            top = "기모 상의";
            outer = "코트";
            bottom = "기모 팬츠";
            shoes = rainy ? "방수 부츠" : "워커";
            accessory = "목도리";
            comment = "기온이 낮아 보온 중심의 겨울 코디가 적합합니다.";
        }

        if (largeGap && !"없음".equals(outer)) {
            comment = comment + " 일교차가 커서 아우터를 챙기는 것이 좋습니다.";
        }
        if (rainy) {
            comment = comment + " 강수 가능성이 있어 신발은 방수/관리 편의성을 반영했습니다.";
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
