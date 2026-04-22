package com.ootd.backend.recommendation.entity;

import com.ootd.backend.user.entity.Gender;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter
@Entity
@Table(name = "daily_recommendations")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class DailyRecommendation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id")
    private Long userId;

    @Column(name = "target_date", nullable = false)
    private LocalDate targetDate;

    @Enumerated(EnumType.STRING)
    @Column(name = "gender", nullable = false, length = 10)
    private Gender gender;

    @Column(name = "weather_cache_id", nullable = false)
    private Long weatherCacheId;

    @Enumerated(EnumType.STRING)
    @Column(name = "recommendation_type", nullable = false, length = 20)
    private RecommendationType recommendationType;

    @Column(name = "top_item", length = 100)
    private String topItem;

    @Column(name = "outer_item", length = 100)
    private String outerItem;

    @Column(name = "bottom_item", length = 100)
    private String bottomItem;

    @Column(name = "shoes_item", length = 100)
    private String shoesItem;

    @Column(name = "accessory_item", length = 100)
    private String accessoryItem;

    @Column(name = "summary_comment", length = 500)
    private String summaryComment;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
    }

    @Builder
    public DailyRecommendation(Long userId, LocalDate targetDate, Gender gender, Long weatherCacheId,
                               RecommendationType recommendationType, String topItem, String outerItem,
                               String bottomItem, String shoesItem, String accessoryItem, String summaryComment) {
        this.userId = userId;
        this.targetDate = targetDate;
        this.gender = gender;
        this.weatherCacheId = weatherCacheId;
        this.recommendationType = recommendationType;
        this.topItem = topItem;
        this.outerItem = outerItem;
        this.bottomItem = bottomItem;
        this.shoesItem = shoesItem;
        this.accessoryItem = accessoryItem;
        this.summaryComment = summaryComment;
    }
}
