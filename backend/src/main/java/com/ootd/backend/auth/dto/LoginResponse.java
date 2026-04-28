package com.ootd.backend.auth.dto;

import com.ootd.backend.user.entity.Gender;

public record LoginResponse(
        String accessToken,
        String tokenType,
        long expiresIn,
        Long userId,
        String email,
        String nickname,
        Gender gender
) {
}