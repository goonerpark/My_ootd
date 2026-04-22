package com.ootd.backend.weather.provider;

import com.ootd.backend.weather.config.WeatherProperties;
import com.ootd.backend.weather.service.dto.WeatherSnapshot;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Component
public class MockWeatherProvider implements WeatherProvider {

    private final WeatherProperties properties;

    public MockWeatherProvider(WeatherProperties properties) {
        this.properties = properties;
    }

    @Override
    public String providerName() {
        return "mock";
    }

    @Override
    public WeatherSnapshot fetchToday() {
        LocalDate today = LocalDate.now();
        return new WeatherSnapshot(
                today,
                properties.getOpenweather().getRegionCode(),
                "Clouds",
                "Cloudy (mock)",
                BigDecimal.valueOf(20.00).setScale(2, RoundingMode.HALF_UP),
                BigDecimal.valueOf(14.00).setScale(2, RoundingMode.HALF_UP),
                BigDecimal.valueOf(24.00).setScale(2, RoundingMode.HALF_UP),
                BigDecimal.valueOf(20.50).setScale(2, RoundingMode.HALF_UP),
                BigDecimal.valueOf(55.00).setScale(2, RoundingMode.HALF_UP),
                "{\"provider\":\"mock\"}",
                LocalDateTime.now()
        );
    }
}
