package com.ootd.backend.recommendation.dto;

import com.ootd.backend.closet.entity.ClosetCategory;
import com.ootd.backend.closet.entity.ClosetFit;
import com.ootd.backend.closet.entity.ClosetSeason;
import com.ootd.backend.closet.entity.ClosetThickness;
import com.ootd.backend.recommendation.entity.RecommendationSlot;

public record TodayClosetRecommendedItemResponse(
        RecommendationSlot slot,
        Long closetItemId,
        ClosetCategory category,
        String subcategory,
        String color,
        ClosetSeason season,
        ClosetThickness thickness,
        ClosetFit fit,
        String brand,
        String imageUrl,
        String memo,
        String reason
) {
}
