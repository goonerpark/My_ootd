package com.ootd.backend.weather.controller;

import com.ootd.backend.common.api.ApiResponse;
import com.ootd.backend.weather.dto.TodayWeatherResponse;
import com.ootd.backend.weather.service.WeatherQueryService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/weather")
@RequiredArgsConstructor
public class WeatherController {

    private final WeatherQueryService weatherQueryService;

    @GetMapping("/today")
    public ResponseEntity<ApiResponse<TodayWeatherResponse>> getTodayWeather() {
        return ResponseEntity.ok(ApiResponse.ok(weatherQueryService.getTodayWeather()));
    }
}
