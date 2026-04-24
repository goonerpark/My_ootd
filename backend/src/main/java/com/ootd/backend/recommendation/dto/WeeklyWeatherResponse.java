package com.ootd.backend.recommendation.dto;

import java.math.BigDecimal;

public record WeeklyWeatherResponse(
        String weatherMain,
        String weatherDescription,
        BigDecimal minTemp,
        BigDecimal maxTemp,
        BigDecimal currentTemp,
        BigDecimal precipitationProbability,
        BigDecimal humidity
) {
}
