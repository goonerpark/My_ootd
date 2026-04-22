package com.ootd.backend.weather.service;

import com.ootd.backend.weather.config.WeatherProperties;
import com.ootd.backend.weather.dto.TodayWeatherResponse;
import com.ootd.backend.weather.entity.WeatherCache;
import com.ootd.backend.weather.provider.WeatherProvider;
import com.ootd.backend.weather.repository.WeatherCacheRepository;
import com.ootd.backend.weather.service.dto.WeatherSnapshot;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.TransactionDefinition;
import org.springframework.transaction.support.TransactionTemplate;

import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class WeatherQueryService {

    private final WeatherCacheRepository weatherCacheRepository;
    private final WeatherProperties weatherProperties;
    private final List<WeatherProvider> weatherProviders;
    private final PlatformTransactionManager transactionManager;

    @Transactional
    public WeatherCache getOrFetchTodayWeatherCache() {
        LocalDate today = LocalDate.now();
        String regionCode = weatherProperties.getOpenweather().getRegionCode();
        Optional<WeatherCache> existing = weatherCacheRepository.findByTargetDateAndRegionCode(today, regionCode);

        if (existing.isPresent()) {
            WeatherCache cached = existing.get();
            if (isFresh(cached)) {
                return cached;
            }
            WeatherSnapshot snapshot = fetchFromConfiguredProviderWithFallback();
            return updateCacheInNewTransaction(cached.getId(), snapshot);
        }

        WeatherSnapshot snapshot = fetchFromConfiguredProviderWithFallback();
        try {
            return saveCacheInNewTransaction(snapshot);
        } catch (DataIntegrityViolationException ex) {
            return weatherCacheRepository.findByTargetDateAndRegionCode(today, regionCode)
                    .orElseThrow(() -> ex);
        }
    }

    @Transactional
    public TodayWeatherResponse getTodayWeather() {
        WeatherCache cache = getOrFetchTodayWeatherCache();
        return toResponse(cache);
    }

    public TodayWeatherResponse toResponse(WeatherCache cache) {
        return new TodayWeatherResponse(
                cache.getTargetDate(),
                cache.getRegionCode(),
                cache.getWeatherMain(),
                normalizeDescription(cache.getWeatherDescription()),
                cache.getPrecipitationProbability(),
                cache.getMinTemp(),
                cache.getMaxTemp(),
                cache.getCurrentTemp(),
                cache.getHumidity(),
                cache.getFetchedAt()
        );
    }

    private WeatherSnapshot fetchFromConfiguredProviderWithFallback() {
        String provider = weatherProperties.getProvider();
        WeatherProvider configuredProvider = findProviderOrThrow(provider);
        WeatherProvider mockProvider = findProviderOrThrow("mock");

        if ("mock".equalsIgnoreCase(provider)) {
            return mockProvider.fetchToday();
        }

        try {
            return configuredProvider.fetchToday();
        } catch (Exception e) {
            return mockProvider.fetchToday();
        }
    }

    private WeatherProvider findProviderOrThrow(String providerName) {
        return weatherProviders.stream()
                .filter(provider -> provider.providerName().equalsIgnoreCase(providerName))
                .findFirst()
                .orElseThrow(() -> new IllegalStateException("Weather provider not found: " + providerName));
    }

    private WeatherCache saveCacheInNewTransaction(WeatherSnapshot snapshot) {
        TransactionTemplate template = new TransactionTemplate(transactionManager);
        template.setPropagationBehavior(TransactionDefinition.PROPAGATION_REQUIRES_NEW);
        return template.execute(status -> {
            WeatherCache cache = WeatherCache.builder()
                    .targetDate(snapshot.targetDate())
                    .regionCode(snapshot.regionCode())
                    .weatherMain(snapshot.weatherMain())
                    .weatherDescription(snapshot.weatherDescription())
                    .precipitationProbability(snapshot.precipitationProbability())
                    .minTemp(snapshot.minTemp())
                    .maxTemp(snapshot.maxTemp())
                    .currentTemp(snapshot.currentTemp())
                    .humidity(snapshot.humidity())
                    .apiResponseJson(snapshot.rawJson())
                    .fetchedAt(snapshot.fetchedAt())
                    .build();
            return weatherCacheRepository.save(cache);
        });
    }

    private WeatherCache updateCacheInNewTransaction(Long cacheId, WeatherSnapshot snapshot) {
        TransactionTemplate template = new TransactionTemplate(transactionManager);
        template.setPropagationBehavior(TransactionDefinition.PROPAGATION_REQUIRES_NEW);
        return template.execute(status -> {
            WeatherCache cache = weatherCacheRepository.findById(cacheId)
                    .orElseGet(() -> WeatherCache.builder()
                            .targetDate(snapshot.targetDate())
                            .regionCode(snapshot.regionCode())
                            .weatherMain(snapshot.weatherMain())
                            .weatherDescription(snapshot.weatherDescription())
                            .precipitationProbability(snapshot.precipitationProbability())
                            .minTemp(snapshot.minTemp())
                            .maxTemp(snapshot.maxTemp())
                            .currentTemp(snapshot.currentTemp())
                            .humidity(snapshot.humidity())
                            .apiResponseJson(snapshot.rawJson())
                            .fetchedAt(snapshot.fetchedAt())
                            .build());

            cache.updateFromSnapshot(
                    snapshot.weatherMain(),
                    snapshot.weatherDescription(),
                    snapshot.precipitationProbability(),
                    snapshot.minTemp(),
                    snapshot.maxTemp(),
                    snapshot.currentTemp(),
                    snapshot.humidity(),
                    snapshot.rawJson(),
                    snapshot.fetchedAt()
            );
            return weatherCacheRepository.save(cache);
        });
    }

    private boolean isFresh(WeatherCache cache) {
        if (cache.getFetchedAt() == null) {
            return false;
        }
        int refreshMinutes = weatherProperties.getCacheRefreshMinutes();
        if (refreshMinutes <= 0) {
            return false;
        }
        return cache.getFetchedAt().isAfter(LocalDateTime.now().minusMinutes(refreshMinutes));
    }

    private String normalizeDescription(String input) {
        if (input == null || input.isBlank() || containsHangul(input) || !looksLikeUtf8Mojibake(input)) {
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
}
