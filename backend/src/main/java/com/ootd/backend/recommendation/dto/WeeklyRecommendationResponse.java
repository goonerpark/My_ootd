package com.ootd.backend.recommendation.dto;

import java.time.LocalDate;

public record WeeklyRecommendationResponse(
        LocalDate targetDate,
        WeeklyWeatherResponse weather,
        WeeklyOutfitRecommendationResponse recommendation
) {
}
