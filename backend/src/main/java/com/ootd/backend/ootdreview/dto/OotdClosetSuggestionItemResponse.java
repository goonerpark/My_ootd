package com.ootd.backend.ootdreview.dto;

import com.ootd.backend.closet.entity.ClosetCategory;
import com.ootd.backend.closet.entity.ClosetFit;

public record OotdClosetSuggestionItemResponse(
        String slot,
        Long closetItemId,
        ClosetCategory category,
        ClosetFit fit,
        String color,
        String imageUrl,
        String reason
) {
}
