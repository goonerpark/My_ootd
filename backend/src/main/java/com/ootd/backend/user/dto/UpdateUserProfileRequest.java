package com.ootd.backend.user.dto;

import com.ootd.backend.user.entity.BodyType;
import com.ootd.backend.user.entity.PersonalColor;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

public record UpdateUserProfileRequest(
        PersonalColor personalColor,
        BodyType bodyType,

        @DecimalMin(value = "50.0", message = "heightCm must be at least 50.0")
        @DecimalMax(value = "250.0", message = "heightCm must be 250.0 or less")
        BigDecimal heightCm,

        @DecimalMin(value = "20.0", message = "weightKg must be at least 20.0")
        @DecimalMax(value = "250.0", message = "weightKg must be 250.0 or less")
        BigDecimal weightKg,

        @Size(max = 50, message = "preferredStyle must be 50 characters or less")
        String preferredStyle
) {
}