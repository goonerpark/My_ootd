package com.ootd.backend.weather.provider;

import com.ootd.backend.weather.service.dto.WeatherSnapshot;

public interface WeatherProvider {
    String providerName();

    WeatherSnapshot fetchToday();
}
