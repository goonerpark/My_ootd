package com.ootd.backend.ootdpost.dto;

import com.ootd.backend.ootdpost.entity.LookCategory;

import java.time.LocalDateTime;
import java.util.List;

public record OotdPostDetailResponse(
        Long postId,
        String caption,
        LookCategory lookCategory,
        List<OotdPostImageResponse> images,
        List<String> hashtags,
        Long likeCount,
        Long viewCount,
        LocalDateTime createdAt,
        Long authorId,
        String authorNickname,
        String authorProfileImageUrl,
        List<OotdCommentResponse> comments
) {
}
