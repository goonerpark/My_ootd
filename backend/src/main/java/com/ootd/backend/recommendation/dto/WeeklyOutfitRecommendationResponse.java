package com.ootd.backend.recommendation.dto;

public record WeeklyOutfitRecommendationResponse(
        String top,
        String outer,
        String bottom,
        String shoes,
        String accessory,
        String comment
) {
}
