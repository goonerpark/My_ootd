package com.ootd.backend.weather.service.dto;

public record WeatherLocation(
        String regionCode,
        double lat,
        double lon
) {
}
