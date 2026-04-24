package com.ootd.backend.weather.provider.openweather.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import java.util.List;

@JsonIgnoreProperties(ignoreUnknown = true)
public record OpenWeatherOneCallResponse(
        Current current,
        List<Daily> daily
) {
    @JsonIgnoreProperties(ignoreUnknown = true)
    public record Current(
            double temp,
            double humidity,
            List<Weather> weather
    ) {
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record Daily(
            long dt,
            Temp temp,
            double pop,
            double humidity,
            List<Weather> weather
    ) {
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record Temp(
            double day,
            double min,
            double max
    ) {
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record Weather(
            String main,
            String description
    ) {
    }
}
