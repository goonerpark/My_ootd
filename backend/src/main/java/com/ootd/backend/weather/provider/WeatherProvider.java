package com.ootd.backend.weather.provider;

import com.ootd.backend.weather.service.dto.WeatherSnapshot;
import com.ootd.backend.weather.service.dto.WeatherLocation;

import java.time.LocalDate;
import java.util.List;

public interface WeatherProvider {
    String providerName();

    WeatherSnapshot fetchToday();

    default WeatherSnapshot fetchToday(WeatherLocation location) {
        return fetchToday();
    }

    default List<WeatherSnapshot> fetchWeekly(LocalDate startDate, int days) {
        return List.of(fetchToday());
    }

    default List<WeatherSnapshot> fetchWeekly(WeatherLocation location, LocalDate startDate, int days) {
        return fetchWeekly(startDate, days);
    }
}
