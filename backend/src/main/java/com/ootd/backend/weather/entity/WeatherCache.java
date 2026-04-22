package com.ootd.backend.weather.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter
@Entity
@Table(
        name = "weather_cache",
        uniqueConstraints = @UniqueConstraint(name = "uk_weather_cache_target_date_region_code", columnNames = {"target_date", "region_code"})
)
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class WeatherCache {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "target_date", nullable = false)
    private LocalDate targetDate;

    @Column(name = "region_code", nullable = false, length = 50)
    private String regionCode;

    @Column(name = "weather_main", nullable = false, length = 50)
    private String weatherMain;

    @Column(name = "weather_description", nullable = false, length = 100)
    private String weatherDescription;

    @Column(name = "precipitation_probability", precision = 5, scale = 2)
    private BigDecimal precipitationProbability;

    @Column(name = "min_temp", nullable = false, precision = 5, scale = 2)
    private BigDecimal minTemp;

    @Column(name = "max_temp", nullable = false, precision = 5, scale = 2)
    private BigDecimal maxTemp;

    @Column(name = "current_temp", precision = 5, scale = 2)
    private BigDecimal currentTemp;

    @Column(name = "humidity", precision = 5, scale = 2)
    private BigDecimal humidity;

    @Column(name = "api_response_json", columnDefinition = "TEXT")
    private String apiResponseJson;

    @Column(name = "fetched_at", nullable = false)
    private LocalDateTime fetchedAt;

    @Builder
    public WeatherCache(LocalDate targetDate, String regionCode, String weatherMain, String weatherDescription,
                        BigDecimal precipitationProbability, BigDecimal minTemp, BigDecimal maxTemp, BigDecimal currentTemp,
                        BigDecimal humidity, String apiResponseJson, LocalDateTime fetchedAt) {
        this.targetDate = targetDate;
        this.regionCode = regionCode;
        this.weatherMain = weatherMain;
        this.weatherDescription = weatherDescription;
        this.precipitationProbability = precipitationProbability;
        this.minTemp = minTemp;
        this.maxTemp = maxTemp;
        this.currentTemp = currentTemp;
        this.humidity = humidity;
        this.apiResponseJson = apiResponseJson;
        this.fetchedAt = fetchedAt;
    }

    public void updateFromSnapshot(String weatherMain, String weatherDescription,
                                   BigDecimal precipitationProbability, BigDecimal minTemp, BigDecimal maxTemp,
                                   BigDecimal currentTemp, BigDecimal humidity, String apiResponseJson,
                                   LocalDateTime fetchedAt) {
        this.weatherMain = weatherMain;
        this.weatherDescription = weatherDescription;
        this.precipitationProbability = precipitationProbability;
        this.minTemp = minTemp;
        this.maxTemp = maxTemp;
        this.currentTemp = currentTemp;
        this.humidity = humidity;
        this.apiResponseJson = apiResponseJson;
        this.fetchedAt = fetchedAt;
    }
}
