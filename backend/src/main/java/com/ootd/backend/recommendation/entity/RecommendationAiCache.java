package com.ootd.backend.recommendation.entity;

import com.ootd.backend.user.entity.BaseTimeEntity;
import com.ootd.backend.user.entity.Gender;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Getter
@Entity
@Table(
        name = "recommendation_ai_cache",
        uniqueConstraints = @UniqueConstraint(
                name = "uk_recommendation_ai_cache_daily",
                columnNames = {"cache_date", "cache_type", "user_id", "weather_key", "gender"}
        )
)
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class RecommendationAiCache extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "cache_date", nullable = false)
    private LocalDate cacheDate;

    @Enumerated(EnumType.STRING)
    @Column(name = "cache_type", nullable = false, length = 10)
    private RecommendationAiCacheType cacheType;

    @Column(name = "user_id")
    private Long userId;

    @Column(name = "weather_key", nullable = false, length = 120)
    private String weatherKey;

    @Enumerated(EnumType.STRING)
    @Column(name = "gender", nullable = false, length = 10)
    private Gender gender;

    @Column(name = "recommendation_json", nullable = false, columnDefinition = "TEXT")
    private String recommendationJson;

    @Builder
    public RecommendationAiCache(
            LocalDate cacheDate,
            RecommendationAiCacheType cacheType,
            Long userId,
            String weatherKey,
            Gender gender,
            String recommendationJson
    ) {
        this.cacheDate = cacheDate;
        this.cacheType = cacheType;
        this.userId = userId;
        this.weatherKey = weatherKey;
        this.gender = gender;
        this.recommendationJson = recommendationJson;
    }

    public void updateRecommendationJson(String recommendationJson) {
        this.recommendationJson = recommendationJson;
    }
}
