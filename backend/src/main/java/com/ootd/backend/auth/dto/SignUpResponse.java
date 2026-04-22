package com.ootd.backend.auth.dto;

import com.ootd.backend.user.entity.Gender;
import com.ootd.backend.user.entity.Role;

import java.time.LocalDateTime;

public record SignUpResponse(
        Long userId,
        String email,
        String nickname,
        Gender gender,
        Role role,
        LocalDateTime createdAt
) {
}
