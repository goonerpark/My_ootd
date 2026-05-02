package com.ootd.backend.ootdpost.dto;

import java.time.LocalDateTime;

public record OotdCommentResponse(
        Long commentId,
        String content,
        LocalDateTime createdAt,
        Long authorId,
        String authorNickname,
        String authorProfileImageUrl
) {
}
