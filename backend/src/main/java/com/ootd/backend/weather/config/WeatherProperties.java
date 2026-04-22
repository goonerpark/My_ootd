package com.ootd.backend.weather.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;

@Getter
@Setter
@ConfigurationProperties(prefix = "weather")
public class WeatherProperties {

    private String provider;
    private int cacheRefreshMinutes = 60;
    private OpenWeather openweather = new OpenWeather();

    @Getter
    @Setter
    public static class OpenWeather {
        private String apiKey;
        private String baseUrl;
        private double lat;
        private double lon;
        private String units;
        private String lang;
        private String regionCode;
    }
}
