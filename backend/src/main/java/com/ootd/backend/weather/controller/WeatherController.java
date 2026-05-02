package com.ootd.backend.weather.controller;

import com.ootd.backend.common.api.ApiResponse;
import com.ootd.backend.weather.dto.TodayWeatherResponse;
import com.ootd.backend.weather.service.WeatherQueryService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;

@RestController
@RequestMapping("/api/weather")
@RequiredArgsConstructor
public class WeatherController {

    private final WeatherQueryService weatherQueryService;

    @GetMapping("/today")
    public ResponseEntity<ApiResponse<TodayWeatherResponse>> getTodayWeather(
            @RequestParam(required = false) String regionCode,
            @RequestParam(required = false) Double lat,
            @RequestParam(required = false) Double lon,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate targetDate,
            @RequestParam(required = false) String startHour,
            @RequestParam(required = false) String endHour
    ) {
        if (regionCode == null && lat == null && lon == null && targetDate == null) {
            return ResponseEntity.ok(ApiResponse.ok(weatherQueryService.getTodayWeather()));
        }
        return ResponseEntity.ok(ApiResponse.ok(weatherQueryService.getWeather(regionCode, lat, lon, targetDate)));
    }
}
