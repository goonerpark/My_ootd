package com.ootd.backend.recommendation.repository;

import com.ootd.backend.recommendation.entity.RecommendationAiCache;
import com.ootd.backend.recommendation.entity.RecommendationAiCacheType;
import com.ootd.backend.user.entity.Gender;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface RecommendationAiCacheRepository extends JpaRepository<RecommendationAiCache, Long> {

    Optional<RecommendationAiCache> findByCacheDateAndCacheTypeAndUserIdAndWeatherKeyAndGender(
            LocalDate cacheDate,
            RecommendationAiCacheType cacheType,
            Long userId,
            String weatherKey,
            Gender gender
    );

    Optional<RecommendationAiCache> findFirstByCacheDateAndCacheTypeAndUserIdAndGenderOrderByCreatedAtAsc(
            LocalDate cacheDate,
            RecommendationAiCacheType cacheType,
            Long userId,
            Gender gender
    );

    List<RecommendationAiCache> findByCacheDateAndCacheTypeAndUserIdAndWeatherKey(
            LocalDate cacheDate,
            RecommendationAiCacheType cacheType,
            Long userId,
            String weatherKey
    );
}
