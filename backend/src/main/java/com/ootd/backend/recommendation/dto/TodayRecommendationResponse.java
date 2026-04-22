package com.ootd.backend.recommendation.dto;

import com.ootd.backend.user.entity.Gender;
import com.ootd.backend.weather.dto.TodayWeatherResponse;

import java.time.LocalDate;

public record TodayRecommendationResponse(
        Long recommendationId,
        Long userId,
        LocalDate targetDate,
        Gender gender,
        String topItem,
        String outerItem,
        String bottomItem,
        String shoesItem,
        String accessoryItem,
        String summaryComment,
        TodayWeatherResponse weather
) {
}
