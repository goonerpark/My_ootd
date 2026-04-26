package com.ootd.backend.closet.dto;

import com.ootd.backend.closet.entity.ClosetCategory;
import com.ootd.backend.closet.entity.ClosetFit;
import com.ootd.backend.closet.entity.ClosetSeason;
import com.ootd.backend.closet.entity.ClosetThickness;

import java.time.LocalDateTime;

public record ClosetItemResponse(
        Long id,
        Long userId,
        ClosetCategory category,
        String subcategory,
        String color,
        ClosetSeason season,
        ClosetThickness thickness,
        ClosetFit fit,
        String brand,
        String imageUrl,
        String memo,
        Boolean isActive,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
}
