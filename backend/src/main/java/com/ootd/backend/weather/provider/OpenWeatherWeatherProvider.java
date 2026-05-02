package com.ootd.backend.weather.provider;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.ootd.backend.weather.config.WeatherProperties;
import com.ootd.backend.weather.provider.openweather.dto.OpenWeatherOneCallResponse;
import com.ootd.backend.weather.service.dto.WeatherSnapshot;
import com.ootd.backend.weather.service.dto.WeatherLocation;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.List;

@Component
public class OpenWeatherWeatherProvider implements WeatherProvider {

    private final WeatherProperties properties;
    private final RestClient restClient;
    private final ObjectMapper objectMapper;

    public OpenWeatherWeatherProvider(WeatherProperties properties, RestClient restClient, ObjectMapper objectMapper) {
        this.properties = properties;
        this.restClient = restClient;
        this.objectMapper = objectMapper;
    }

    @Override
    public String providerName() {
        return "openweather";
    }

    @Override
    public WeatherSnapshot fetchToday() {
        List<WeatherSnapshot> snapshots = fetchWeekly(defaultLocation(), LocalDate.now(), 1);
        if (snapshots.isEmpty()) {
            throw new IllegalStateException("OpenWeather response is invalid");
        }
        return snapshots.get(0);
    }

    @Override
    public WeatherSnapshot fetchToday(WeatherLocation location) {
        List<WeatherSnapshot> snapshots = fetchWeekly(location, LocalDate.now(), 1);
        if (snapshots.isEmpty()) {
            throw new IllegalStateException("OpenWeather response is invalid");
        }
        return snapshots.get(0);
    }

    @Override
    public List<WeatherSnapshot> fetchWeekly(LocalDate startDate, int days) {
        return fetchWeekly(defaultLocation(), startDate, days);
    }

    @Override
    public List<WeatherSnapshot> fetchWeekly(WeatherLocation location, LocalDate startDate, int days) {
        WeatherProperties.OpenWeather config = properties.getOpenweather();
        if (config.getApiKey() == null || config.getApiKey().isBlank()) {
            throw new IllegalStateException("OPENWEATHER_API_KEY is empty");
        }

        OpenWeatherOneCallResponse response = fetchOneCallResponse(config, location);

        if (response == null || response.daily() == null || response.daily().isEmpty()) {
            throw new IllegalStateException("OpenWeather response is invalid");
        }

        int size = Math.max(1, Math.min(days, 8));
        List<WeatherSnapshot> snapshots = new ArrayList<>();
        LocalDateTime fetchedAt = LocalDateTime.now();
        String rawJson = toJson(response);

        for (int i = 0; i < Math.min(size, response.daily().size()); i++) {
            OpenWeatherOneCallResponse.Daily daily = response.daily().get(i);

            String main = firstWeatherMain(daily.weather(), response.current() == null ? null : response.current().weather());
            String description = firstWeatherDescription(daily.weather(), response.current() == null ? null : response.current().weather());
            LocalDate targetDate = daily.dt() > 0
                    ? Instant.ofEpochSecond(daily.dt()).atZone(ZoneId.systemDefault()).toLocalDate()
                    : startDate.plusDays(i);

            BigDecimal currentTemp = decimal(daily.temp().day());
            if (i == 0 && response.current() != null) {
                currentTemp = decimal(response.current().temp());
            }

            snapshots.add(new WeatherSnapshot(
                    targetDate,
                    location.regionCode(),
                    main,
                    description,
                    percent(daily.pop()),
                    decimal(daily.temp().min()),
                    decimal(daily.temp().max()),
                    currentTemp,
                    decimal(daily.humidity()),
                    rawJson,
                    fetchedAt
            ));
        }

        return snapshots;
    }

    private String extractHost(String baseUrl) {
        return baseUrl.replace("https://", "").replace("http://", "");
    }

    private OpenWeatherOneCallResponse fetchOneCallResponse(WeatherProperties.OpenWeather config, WeatherLocation location) {
        return restClient.get()
                .uri(uriBuilder -> uriBuilder
                        .scheme("https")
                        .host(extractHost(config.getBaseUrl()))
                        .path("/data/3.0/onecall")
                        .queryParam("lat", location.lat())
                        .queryParam("lon", location.lon())
                        .queryParam("appid", config.getApiKey())
                        .queryParam("units", config.getUnits())
                        .queryParam("lang", config.getLang())
                        .queryParam("exclude", "minutely,hourly,alerts")
                        .build())
                .retrieve()
                .body(OpenWeatherOneCallResponse.class);
    }

    private WeatherLocation defaultLocation() {
        WeatherProperties.OpenWeather config = properties.getOpenweather();
        return new WeatherLocation(config.getRegionCode(), config.getLat(), config.getLon());
    }

    private BigDecimal decimal(double value) {
        return BigDecimal.valueOf(value).setScale(2, RoundingMode.HALF_UP);
    }

    private BigDecimal percent(double pop) {
        return BigDecimal.valueOf(pop * 100).setScale(2, RoundingMode.HALF_UP);
    }

    private String firstWeatherMain(List<OpenWeatherOneCallResponse.Weather> dailyWeather,
                                    List<OpenWeatherOneCallResponse.Weather> currentWeather) {
        if (dailyWeather != null && !dailyWeather.isEmpty()) {
            return dailyWeather.get(0).main();
        }
        if (currentWeather != null && !currentWeather.isEmpty()) {
            return currentWeather.get(0).main();
        }
        return "Unknown";
    }

    private String firstWeatherDescription(List<OpenWeatherOneCallResponse.Weather> dailyWeather,
                                           List<OpenWeatherOneCallResponse.Weather> currentWeather) {
        if (dailyWeather != null && !dailyWeather.isEmpty()) {
            return normalizeDescription(dailyWeather.get(0).description());
        }
        if (currentWeather != null && !currentWeather.isEmpty()) {
            return normalizeDescription(currentWeather.get(0).description());
        }
        return "unknown";
    }

    private String normalizeDescription(String input) {
        if (input == null || input.isBlank()) {
            return input;
        }
        if (containsHangul(input)) {
            return input;
        }
        if (!looksLikeUtf8Mojibake(input)) {
            return input;
        }
        String repaired = new String(input.getBytes(StandardCharsets.ISO_8859_1), StandardCharsets.UTF_8);
        return containsHangul(repaired) ? repaired : input;
    }

    private boolean containsHangul(String value) {
        return value.chars().anyMatch(ch -> (ch >= 0xAC00 && ch <= 0xD7A3) || (ch >= 0x1100 && ch <= 0x11FF));
    }

    private boolean looksLikeUtf8Mojibake(String value) {
        return value.chars().anyMatch(ch -> (ch >= 0x00C0 && ch <= 0x017F) || ch == 0x00A0);
    }

    private String toJson(OpenWeatherOneCallResponse response) {
        try {
            return objectMapper.writeValueAsString(response);
        } catch (JsonProcessingException e) {
            return "{\"provider\":\"openweather\",\"raw\":\"serialization_failed\"}";
        }
    }
}
