package com.ootd.backend.survey.dto;

import com.ootd.backend.survey.entity.OutingPurpose;

import java.time.LocalDate;
import java.time.LocalDateTime;

public record TodaySurveyResponse(
        Long surveyId,
        Long userId,
        LocalDate surveyDate,
        OutingPurpose outingPurpose,
        String notes,
        LocalDateTime createdAt
) {
}
