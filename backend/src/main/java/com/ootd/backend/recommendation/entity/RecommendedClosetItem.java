package com.ootd.backend.recommendation.entity;

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

import java.time.LocalDateTime;

@Getter
@Entity
@Table(name = "recommended_closet_items")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class RecommendedClosetItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "recommendation_id", nullable = false)
    private Long recommendationId;

    @Column(name = "closet_item_id", nullable = false)
    private Long closetItemId;

    @Enumerated(EnumType.STRING)
    @Column(name = "recommendation_slot", nullable = false, length = 20)
    private RecommendationSlot recommendationSlot;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Builder
    public RecommendedClosetItem(Long recommendationId, Long closetItemId, RecommendationSlot recommendationSlot) {
        this.recommendationId = recommendationId;
        this.closetItemId = closetItemId;
        this.recommendationSlot = recommendationSlot;
    }

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
    }
}
