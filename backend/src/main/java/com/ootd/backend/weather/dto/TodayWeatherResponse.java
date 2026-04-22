package com.ootd.backend.weather.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

public record TodayWeatherResponse(
        LocalDate targetDate,
        String regionCode,
        String weatherMain,
        String weatherDescription,
        BigDecimal precipitationProbability,
        BigDecimal minTemp,
        BigDecimal maxTemp,
        BigDecimal currentTemp,
        BigDecimal humidity,
        LocalDateTime fetchedAt
) {
}
