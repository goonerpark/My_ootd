package com.ootd.backend.ai.dto;

public record AiRecommendationResult(
        String top,
        String outer,
        String bottom,
        String shoes,
        String accessory,
        String comment
) {
}
