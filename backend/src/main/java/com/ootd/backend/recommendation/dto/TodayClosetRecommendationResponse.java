package com.ootd.backend.recommendation.dto;

import com.ootd.backend.recommendation.entity.RecommendationType;
import com.ootd.backend.weather.dto.TodayWeatherResponse;

import java.time.LocalDate;
import java.util.List;

public record TodayClosetRecommendationResponse(
        LocalDate targetDate,
        RecommendationType recommendationType,
        TodayWeatherResponse weather,
        String top,
        String outer,
        String bottom,
        String shoes,
        String accessory,
        String summaryComment,
        List<TodayClosetRecommendedItemResponse> closetItems
) {
}
