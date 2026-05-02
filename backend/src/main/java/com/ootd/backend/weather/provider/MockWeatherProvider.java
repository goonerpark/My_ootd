package com.ootd.backend.weather.provider;

import com.ootd.backend.weather.config.WeatherProperties;
import com.ootd.backend.weather.service.dto.WeatherSnapshot;
import com.ootd.backend.weather.service.dto.WeatherLocation;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

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
        return fetchToday(defaultLocation());
    }

    @Override
    public WeatherSnapshot fetchToday(WeatherLocation location) {
        LocalDate today = LocalDate.now();
        return new WeatherSnapshot(
                today,
                location.regionCode(),
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

    @Override
    public List<WeatherSnapshot> fetchWeekly(LocalDate startDate, int days) {
        return fetchWeekly(defaultLocation(), startDate, days);
    }

    @Override
    public List<WeatherSnapshot> fetchWeekly(WeatherLocation location, LocalDate startDate, int days) {
        int size = Math.max(1, Math.min(days, 8));
        List<WeatherSnapshot> snapshots = new ArrayList<>();

        for (int i = 0; i < size; i++) {
            LocalDate targetDate = startDate.plusDays(i);
            BigDecimal minTemp = BigDecimal.valueOf(12 + (i % 4)).setScale(2, RoundingMode.HALF_UP);
            BigDecimal maxTemp = BigDecimal.valueOf(20 + (i % 5)).setScale(2, RoundingMode.HALF_UP);
            BigDecimal currentTemp = minTemp.add(maxTemp).divide(BigDecimal.valueOf(2), 2, RoundingMode.HALF_UP);
            BigDecimal pop = BigDecimal.valueOf((i % 3) * 20.0).setScale(2, RoundingMode.HALF_UP);
            BigDecimal humidity = BigDecimal.valueOf(50 + (i * 5)).setScale(2, RoundingMode.HALF_UP);

            snapshots.add(new WeatherSnapshot(
                    targetDate,
                    location.regionCode(),
                    "Clouds",
                    "Cloudy (mock)",
                    pop,
                    minTemp,
                    maxTemp,
                    currentTemp,
                    humidity,
                    "{\"provider\":\"mock\",\"type\":\"weekly\"}",
                    LocalDateTime.now()
            ));
        }

        return snapshots;
    }

    private WeatherLocation defaultLocation() {
        WeatherProperties.OpenWeather config = properties.getOpenweather();
        return new WeatherLocation(config.getRegionCode(), config.getLat(), config.getLon());
    }
}
