package com.ootd.backend.recommendation.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.ootd.backend.ai.dto.AiRecommendationResult;
import com.ootd.backend.ai.service.GeminiRecommendationService;
import com.ootd.backend.recommendation.entity.RecommendationAiCache;
import com.ootd.backend.recommendation.entity.RecommendationAiCacheType;
import com.ootd.backend.recommendation.repository.RecommendationAiCacheRepository;
import com.ootd.backend.recommendation.service.dto.CachedRecommendation;
import com.ootd.backend.recommendation.service.dto.RecommendationDraft;
import com.ootd.backend.survey.entity.SurveyAnswer;
import com.ootd.backend.user.entity.Gender;
import com.ootd.backend.user.entity.User;
import com.ootd.backend.user.entity.UserProfile;
import com.ootd.backend.weather.entity.WeatherCache;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.EnumMap;
import java.util.Map;
import java.util.function.Function;

@Service
@Slf4j
@RequiredArgsConstructor
public class RecommendationAiCacheService {

    private static final ZoneId SEOUL_ZONE = ZoneId.of("Asia/Seoul");
    private static final long GUEST_USER_ID = 0L;

    private final RecommendationAiCacheRepository cacheRepository;
    private final GeminiRecommendationService geminiRecommendationService;
    private final ObjectMapper objectMapper;

    @Transactional
    public CachedRecommendation getGuestRecommendation(
            WeatherCache weather,
            Gender requestedGender,
            Function<Gender, RecommendationDraft> fallbackFactory
    ) {
        LocalDate cacheDate = todayInSeoul();
        String weatherKey = buildWeatherKey(weather);

        return cacheRepository.findByCacheDateAndCacheTypeAndUserIdAndWeatherKeyAndGender(
                        cacheDate,
                        RecommendationAiCacheType.GUEST,
                        GUEST_USER_ID,
                        weatherKey,
                        requestedGender
                )
                .map(this::toCachedRecommendation)
                .orElseGet(() -> createGuestPairAndReturnRequested(weather, requestedGender, fallbackFactory, cacheDate, weatherKey));
    }

    @Transactional
    public CachedRecommendation getUserRecommendation(
            WeatherCache weather,
            User user,
            UserProfile profile,
            SurveyAnswer survey,
            RecommendationDraft fallbackDraft
    ) {
        LocalDate cacheDate = todayInSeoul();
        String weatherKey = buildWeatherKey(weather);
        Long userId = user.getId();
        Gender gender = user.getGender();

        return cacheRepository.findFirstByCacheDateAndCacheTypeAndUserIdAndGenderOrderByCreatedAtAsc(
                        cacheDate,
                        RecommendationAiCacheType.USER,
                        userId,
                        gender
                )
                .map(cache -> {
                    log.info(
                            "USER CACHE HIT userId={} cacheDate={} gender={} cachedWeatherKey={} currentWeatherKey={}",
                            userId,
                            cacheDate,
                            gender,
                            cache.getWeatherKey(),
                            weatherKey
                    );
                    return toCachedRecommendation(cache);
                })
                .orElseGet(() -> {
                    log.info("USER CACHE MISS \u2192 AI CALL userId={} cacheDate={} weatherKey={} gender={}", userId, cacheDate, weatherKey, gender);
                    return createUserRecommendation(weather, user, profile, survey, fallbackDraft, cacheDate, weatherKey);
                });
    }
    private CachedRecommendation createGuestPairAndReturnRequested(
            WeatherCache weather,
            Gender requestedGender,
            Function<Gender, RecommendationDraft> fallbackFactory,
            LocalDate cacheDate,
            String weatherKey
    ) {
        Map<Gender, AiRecommendationResult> aiResults = geminiRecommendationService.recommendGuestPair(weather);
        Map<Gender, RecommendationDraft> drafts = new EnumMap<>(Gender.class);

        for (Gender gender : Gender.values()) {
            AiRecommendationResult aiResult = aiResults.get(gender);
            drafts.put(gender, aiResult == null ? fallbackFactory.apply(gender) : toDraft(aiResult));
        }

        Map<Gender, RecommendationAiCache> savedCaches = new EnumMap<>(Gender.class);
        for (Map.Entry<Gender, RecommendationDraft> entry : drafts.entrySet()) {
            savedCaches.put(entry.getKey(), saveCache(
                    cacheDate,
                    RecommendationAiCacheType.GUEST,
                    GUEST_USER_ID,
                    weatherKey,
                    entry.getKey(),
                    entry.getValue()
            ));
        }

        RecommendationAiCache requested = savedCaches.get(requestedGender);
        if (requested == null) {
            return new CachedRecommendation(null, drafts.get(requestedGender));
        }
        return toCachedRecommendation(requested);
    }

    private CachedRecommendation createUserRecommendation(
            WeatherCache weather,
            User user,
            UserProfile profile,
            SurveyAnswer survey,
            RecommendationDraft fallbackDraft,
            LocalDate cacheDate,
            String weatherKey
    ) {
        RecommendationDraft draft = geminiRecommendationService.recommend(weather, user, profile, survey)
                .map(this::toDraft)
                .orElse(fallbackDraft);

        RecommendationAiCache cache = saveCache(
                cacheDate,
                RecommendationAiCacheType.USER,
                user.getId(),
                weatherKey,
                user.getGender(),
                draft
        );
        return toCachedRecommendation(cache);
    }

    private RecommendationAiCache saveCache(
            LocalDate cacheDate,
            RecommendationAiCacheType cacheType,
            Long userId,
            String weatherKey,
            Gender gender,
            RecommendationDraft draft
    ) {
        String recommendationJson = toJson(draft);
        try {
            return cacheRepository.findByCacheDateAndCacheTypeAndUserIdAndWeatherKeyAndGender(
                            cacheDate,
                            cacheType,
                            userId,
                            weatherKey,
                            gender
                    )
                    .map(existing -> {
                        existing.updateRecommendationJson(recommendationJson);
                        return existing;
                    })
                    .orElseGet(() -> cacheRepository.save(RecommendationAiCache.builder()
                            .cacheDate(cacheDate)
                            .cacheType(cacheType)
                            .userId(userId)
                            .weatherKey(weatherKey)
                            .gender(gender)
                            .recommendationJson(recommendationJson)
                            .build()));
        } catch (DataIntegrityViolationException ex) {
            log.debug("Recommendation cache was created concurrently. Reading existing cache.", ex);
            return cacheRepository.findByCacheDateAndCacheTypeAndUserIdAndWeatherKeyAndGender(
                            cacheDate,
                            cacheType,
                            userId,
                            weatherKey,
                            gender
                    )
                    .orElseThrow(() -> ex);
        }
    }

    private CachedRecommendation toCachedRecommendation(RecommendationAiCache cache) {
        return new CachedRecommendation(cache.getId(), fromJson(cache.getRecommendationJson()));
    }

    private RecommendationDraft toDraft(AiRecommendationResult result) {
        return new RecommendationDraft(
                sanitize(result.top()),
                sanitize(result.outer()),
                sanitize(result.bottom()),
                sanitize(result.shoes()),
                sanitize(result.accessory()),
                sanitize(result.comment())
        );
    }

    private String toJson(RecommendationDraft draft) {
        try {
            return objectMapper.writeValueAsString(draft);
        } catch (Exception ex) {
            throw new IllegalStateException("Failed to serialize recommendation cache.", ex);
        }
    }

    private RecommendationDraft fromJson(String json) {
        try {
            return objectMapper.readValue(json, RecommendationDraft.class);
        } catch (Exception ex) {
            log.warn("Failed to parse recommendation cache JSON. Empty fallback will be returned.", ex);
            return new RecommendationDraft("없음", "없음", "없음", "없음", "없음", "추천 캐시를 읽지 못했습니다.");
        }
    }

    private LocalDate todayInSeoul() {
        return LocalDate.now(SEOUL_ZONE);
    }

    private String buildWeatherKey(WeatherCache weather) {
        return String.join("|",
                sanitizeKey(weather.getRegionCode()),
                sanitizeKey(weather.getWeatherMain()),
                temperatureRange(weather)
        );
    }

    private String temperatureRange(WeatherCache weather) {
        BigDecimal baseTemp = weather.getCurrentTemp();
        if (baseTemp == null && weather.getMinTemp() != null && weather.getMaxTemp() != null) {
            baseTemp = weather.getMinTemp().add(weather.getMaxTemp()).divide(BigDecimal.valueOf(2), 2, RoundingMode.HALF_UP);
        }
        if (baseTemp == null) {
            return "TEMP_UNKNOWN";
        }

        int temp = baseTemp.setScale(0, RoundingMode.FLOOR).intValue();
        int lower = Math.floorDiv(temp, 5) * 5;
        int upper = lower + 5;
        return "TEMP_" + lower + "_" + upper;
    }

    private String sanitizeKey(String value) {
        if (value == null || value.isBlank()) {
            return "UNKNOWN";
        }
        return value.trim().toUpperCase().replaceAll("[^A-Z0-9_-]", "_");
    }

    private String sanitize(String value) {
        if (value == null || value.isBlank()) {
            return "없음";
        }
        return value.trim();
    }
}


