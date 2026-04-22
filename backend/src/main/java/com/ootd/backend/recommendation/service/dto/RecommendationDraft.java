package com.ootd.backend.recommendation.service.dto;

public record RecommendationDraft(
        String topItem,
        String outerItem,
        String bottomItem,
        String shoesItem,
        String accessoryItem,
        String summaryComment
) {
}
