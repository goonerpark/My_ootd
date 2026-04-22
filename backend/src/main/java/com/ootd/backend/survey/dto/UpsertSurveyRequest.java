package com.ootd.backend.survey.dto;

import com.ootd.backend.survey.entity.OutingPurpose;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record UpsertSurveyRequest(
        @NotNull OutingPurpose outingPurpose,
        @Size(max = 255) String notes
) {
}
