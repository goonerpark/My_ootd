package com.ootd.backend.weather.repository;

import com.ootd.backend.weather.entity.WeatherCache;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.Optional;

public interface WeatherCacheRepository extends JpaRepository<WeatherCache, Long> {
    Optional<WeatherCache> findByTargetDateAndRegionCode(LocalDate targetDate, String regionCode);
}
