package com.ootd.backend.ootdpost.dto;

import java.time.LocalDateTime;
import java.util.List;

public record OotdCommentResponse(
        Long commentId,
        Long parentCommentId,
        String content,
        LocalDateTime createdAt,
        Long authorId,
        String authorNickname,
        String authorProfileImageUrl,
        List<OotdCommentResponse> replies
) {
}
