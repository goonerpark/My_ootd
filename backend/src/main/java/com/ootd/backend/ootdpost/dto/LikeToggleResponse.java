package com.ootd.backend.ootdpost.dto;

public record LikeToggleResponse(
        Long postId,
        boolean liked,
        Long likeCount
) {
}
