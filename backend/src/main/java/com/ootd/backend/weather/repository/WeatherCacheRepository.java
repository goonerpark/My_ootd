package com.ootd.backend.weather.repository;

import com.ootd.backend.weather.entity.WeatherCache;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface WeatherCacheRepository extends JpaRepository<WeatherCache, Long> {
    Optional<WeatherCache> findFirstByTargetDateAndRegionCodeOrderByFetchedAtDescIdDesc(LocalDate targetDate, String regionCode);

    List<WeatherCache> findByTargetDateBetweenAndRegionCode(LocalDate startDate, LocalDate endDate, String regionCode);
}
