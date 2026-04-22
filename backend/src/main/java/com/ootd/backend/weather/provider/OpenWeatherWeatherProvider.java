package com.ootd.backend.weather.provider;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.ootd.backend.weather.config.WeatherProperties;
import com.ootd.backend.weather.provider.openweather.dto.OpenWeatherOneCallResponse;
import com.ootd.backend.weather.service.dto.WeatherSnapshot;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.time.LocalDateTime;
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
        WeatherProperties.OpenWeather config = properties.getOpenweather();
        if (config.getApiKey() == null || config.getApiKey().isBlank()) {
            throw new IllegalStateException("OPENWEATHER_API_KEY is empty");
        }

        OpenWeatherOneCallResponse response = restClient.get()
                .uri(uriBuilder -> uriBuilder
                        .scheme("https")
                        .host(extractHost(config.getBaseUrl()))
                        .path("/data/3.0/onecall")
                        .queryParam("lat", config.getLat())
                        .queryParam("lon", config.getLon())
                        .queryParam("appid", config.getApiKey())
                        .queryParam("units", config.getUnits())
                        .queryParam("lang", config.getLang())
                        .queryParam("exclude", "minutely,hourly,alerts")
                        .build())
                .retrieve()
                .body(OpenWeatherOneCallResponse.class);

        if (response == null || response.current() == null || response.daily() == null || response.daily().isEmpty()) {
            throw new IllegalStateException("OpenWeather response is invalid");
        }

        OpenWeatherOneCallResponse.Daily today = response.daily().get(0);
        String main = firstWeatherMain(today.weather(), response.current().weather());
        String description = firstWeatherDescription(today.weather(), response.current().weather());

        return new WeatherSnapshot(
                LocalDate.now(),
                config.getRegionCode(),
                main,
                description,
                percent(today.pop()),
                decimal(today.temp().min()),
                decimal(today.temp().max()),
                decimal(response.current().temp()),
                decimal(response.current().humidity()),
                toJson(response),
                LocalDateTime.now()
        );
    }

    private String extractHost(String baseUrl) {
        return baseUrl.replace("https://", "").replace("http://", "");
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
