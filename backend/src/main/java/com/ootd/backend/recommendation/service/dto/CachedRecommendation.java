package com.ootd.backend.recommendation.service.dto;

public record CachedRecommendation(
        Long cacheId,
        RecommendationDraft draft
) {
}
