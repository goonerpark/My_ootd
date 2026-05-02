package com.ootd.backend.ootdpost.dto;

import com.ootd.backend.ootdpost.entity.LookCategory;

import java.time.LocalDateTime;

public record OotdPostSummaryResponse(
        Long postId,
        String thumbnailUrl,
        boolean hasMultipleImages,
        Long likeCount,
        Long viewCount,
        LocalDateTime createdAt,
        String authorNickname,
        String authorProfileImageUrl,
        LookCategory lookCategory
) {
}
