package com.ootd.backend.weather.provider;

import com.ootd.backend.weather.service.dto.WeatherSnapshot;

import java.time.LocalDate;
import java.util.List;

public interface WeatherProvider {
    String providerName();

    WeatherSnapshot fetchToday();

    default List<WeatherSnapshot> fetchWeekly(LocalDate startDate, int days) {
        return List.of(fetchToday());
    }
}
