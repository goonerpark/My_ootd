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
import java.util.Comparator;
import java.util.concurrent.ConcurrentHashMap;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class WeatherQueryService {

    private final WeatherCacheRepository weatherCacheRepository;
    private final WeatherProperties weatherProperties;
    private final List<WeatherProvider> weatherProviders;
    private final PlatformTransactionManager transactionManager;
    private final ConcurrentHashMap<String, Object> weatherCacheLocks = new ConcurrentHashMap<>();

    @Transactional
    public WeatherCache getOrFetchTodayWeatherCache() {
        LocalDate today = LocalDate.now();
        String regionCode = weatherProperties.getOpenweather().getRegionCode();
        String lockKey = today + ":" + regionCode;
        Object lock = weatherCacheLocks.computeIfAbsent(lockKey, key -> new Object());

        synchronized (lock) {
            try {
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
                Optional<WeatherCache> doubleChecked = weatherCacheRepository.findByTargetDateAndRegionCode(today, regionCode);
                if (doubleChecked.isPresent()) {
                    return doubleChecked.get();
                }

                try {
                    return saveCacheInNewTransaction(snapshot);
                } catch (DataIntegrityViolationException ex) {
                    return findCacheAfterDuplicate(today, regionCode)
                            .orElseThrow(() -> ex);
                }
            } finally {
                weatherCacheLocks.remove(lockKey, lock);
            }
        }
    }

    @Transactional
    public TodayWeatherResponse getTodayWeather() {
        WeatherCache cache = getOrFetchTodayWeatherCache();
        return toResponse(cache);
    }

    @Transactional
    public List<WeatherCache> getOrFetchWeatherCaches(LocalDate startDate, int days) {
        int safeDays = Math.max(1, Math.min(days, 8));
        String regionCode = weatherProperties.getOpenweather().getRegionCode();
        LocalDate endDate = startDate.plusDays(safeDays - 1L);

        List<LocalDate> targetDates = startDate.datesUntil(endDate.plusDays(1)).toList();
        List<WeatherCache> existingCaches = weatherCacheRepository
                .findByTargetDateBetweenAndRegionCode(startDate, endDate, regionCode);

        Map<LocalDate, WeatherCache> cacheByDate = existingCaches.stream()
                .collect(Collectors.toMap(WeatherCache::getTargetDate, cache -> cache, (left, right) -> left, HashMap::new));

        List<LocalDate> missingDates = targetDates.stream()
                .filter(date -> !cacheByDate.containsKey(date))
                .toList();

        List<LocalDate> refreshDates = targetDates.stream()
                .filter(date -> cacheByDate.containsKey(date))
                .filter(date -> {
                    WeatherCache cache = cacheByDate.get(date);
                    return cache != null && (!isFresh(cache) || isMockCache(cache));
                })
                .toList();

        if (!missingDates.isEmpty() || !refreshDates.isEmpty()) {
            List<WeatherSnapshot> snapshots = fetchWeeklyFromConfiguredProviderWithFallback(startDate, safeDays);
            Map<LocalDate, WeatherSnapshot> snapshotByDate = snapshots.stream()
                    .collect(Collectors.toMap(WeatherSnapshot::targetDate, snapshot -> snapshot, (left, right) -> left, HashMap::new));

            for (LocalDate missingDate : missingDates) {
                WeatherSnapshot snapshot = snapshotByDate.get(missingDate);
                if (snapshot == null) {
                    continue;
                }
                try {
                    WeatherCache saved = saveCacheInNewTransaction(snapshot);
                    cacheByDate.put(saved.getTargetDate(), saved);
                } catch (DataIntegrityViolationException ex) {
                    findCacheInNewTransaction(missingDate, regionCode)
                            .ifPresent(cache -> cacheByDate.put(cache.getTargetDate(), cache));
                }
            }

            for (LocalDate refreshDate : refreshDates) {
                WeatherCache existing = cacheByDate.get(refreshDate);
                WeatherSnapshot snapshot = snapshotByDate.get(refreshDate);
                if (existing == null || snapshot == null) {
                    continue;
                }
                WeatherCache updated = updateCacheInNewTransaction(existing.getId(), snapshot);
                cacheByDate.put(updated.getTargetDate(), updated);
            }
        }

        return targetDates.stream()
                .map(cacheByDate::get)
                .filter(cache -> cache != null)
                .sorted(Comparator.comparing(WeatherCache::getTargetDate))
                .toList();
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

    private List<WeatherSnapshot> fetchWeeklyFromConfiguredProviderWithFallback(LocalDate startDate, int days) {
        String provider = weatherProperties.getProvider();
        WeatherProvider configuredProvider = findProviderOrThrow(provider);
        WeatherProvider mockProvider = findProviderOrThrow("mock");

        if ("mock".equalsIgnoreCase(provider)) {
            return mockProvider.fetchWeekly(startDate, days);
        }

        try {
            List<WeatherSnapshot> snapshots = configuredProvider.fetchWeekly(startDate, days);
            if (snapshots == null || snapshots.isEmpty()) {
                return mockProvider.fetchWeekly(startDate, days);
            }
            if (snapshots.size() >= days) {
                return snapshots;
            }

            List<WeatherSnapshot> mockSnapshots = mockProvider.fetchWeekly(startDate, days);
            Map<LocalDate, WeatherSnapshot> mergedByDate = new HashMap<>();
            for (WeatherSnapshot snapshot : snapshots) {
                mergedByDate.put(snapshot.targetDate(), snapshot);
            }
            for (WeatherSnapshot mockSnapshot : mockSnapshots) {
                mergedByDate.putIfAbsent(mockSnapshot.targetDate(), mockSnapshot);
            }

            return startDate.datesUntil(startDate.plusDays(days))
                    .map(mergedByDate::get)
                    .filter(snapshot -> snapshot != null)
                    .toList();
        } catch (Exception ex) {
            return mockProvider.fetchWeekly(startDate, days);
        }
    }

    private WeatherProvider findProviderOrThrow(String providerName) {
        return weatherProviders.stream()
                .filter(provider -> provider.providerName().equalsIgnoreCase(providerName))
                .findFirst()
                .orElseThrow(() -> new IllegalStateException("Weather provider not found: " + providerName));
    }

    private WeatherCache saveCacheInNewTransaction(WeatherSnapshot snapshot) {
        TransactionTemplate template = new TransactionTemplate(Objects.requireNonNull(transactionManager));
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
            return weatherCacheRepository.save(Objects.requireNonNull(cache));
        });
    }

    private Optional<WeatherCache> findCacheInNewTransaction(LocalDate targetDate, String regionCode) {
        TransactionTemplate template = new TransactionTemplate(Objects.requireNonNull(transactionManager));
        template.setReadOnly(true);
        template.setPropagationBehavior(TransactionDefinition.PROPAGATION_REQUIRES_NEW);
        return template.execute(status -> weatherCacheRepository.findByTargetDateAndRegionCode(targetDate, regionCode));
    }

    private Optional<WeatherCache> findCacheAfterDuplicate(LocalDate targetDate, String regionCode) {
        Optional<WeatherCache> found = findCacheInNewTransaction(targetDate, regionCode);
        if (found.isPresent()) {
            return found;
        }

        try {
            Thread.sleep(25L);
        } catch (InterruptedException interruptedException) {
            Thread.currentThread().interrupt();
        }
        return findCacheInNewTransaction(targetDate, regionCode);
    }

    private WeatherCache updateCacheInNewTransaction(Long cacheId, WeatherSnapshot snapshot) {
        TransactionTemplate template = new TransactionTemplate(Objects.requireNonNull(transactionManager));
        template.setPropagationBehavior(TransactionDefinition.PROPAGATION_REQUIRES_NEW);
        return template.execute(status -> {
            WeatherCache cache = weatherCacheRepository.findById(Objects.requireNonNull(cacheId))
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
            return weatherCacheRepository.save(Objects.requireNonNull(cache));
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

    private boolean isMockCache(WeatherCache cache) {
        String raw = cache.getApiResponseJson();
        if (raw != null && raw.contains("\"provider\":\"mock\"")) {
            return true;
        }
        String description = cache.getWeatherDescription();
        return description != null && description.toLowerCase().contains("(mock)");
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
