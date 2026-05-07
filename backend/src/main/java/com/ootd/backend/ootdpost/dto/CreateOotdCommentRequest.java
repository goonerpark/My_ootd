package com.ootd.backend.ootdpost.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreateOotdCommentRequest(
        @NotBlank(message = "content is required")
        @Size(max = 500, message = "content must be 500 characters or less")
        String content,
        Long parentCommentId
) {
}
