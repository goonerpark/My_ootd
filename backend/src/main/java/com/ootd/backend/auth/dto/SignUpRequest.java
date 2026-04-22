package com.ootd.backend.auth.dto;

import com.ootd.backend.user.entity.Gender;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record SignUpRequest(
        @NotBlank(message = "email is required")
        @Email(message = "email format is invalid")
        @Size(max = 100, message = "email must be 100 characters or less")
        String email,

        @NotBlank(message = "password is required")
        @Size(min = 8, max = 100, message = "password must be between 8 and 100 characters")
        String password,

        @NotBlank(message = "nickname is required")
        @Size(min = 2, max = 50, message = "nickname must be between 2 and 50 characters")
        String nickname,

        @NotNull(message = "gender is required")
        Gender gender
) {
}
