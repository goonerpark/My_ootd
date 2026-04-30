package com.ootd.backend.recommendation.dto;

import com.ootd.backend.user.entity.Gender;

import java.time.LocalDate;
import java.time.LocalDateTime;

public record RecommendationHistoryResponse(
        Long recommendationId,
        LocalDate targetDate,
        Gender gender,
        String topItem,
        String outerItem,
        String bottomItem,
        String shoesItem,
        String accessoryItem,
        String summaryComment,
        LocalDateTime createdAt
) {
}
