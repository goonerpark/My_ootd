package com.ootd.backend.ai.service;

import com.ootd.backend.ai.dto.AiRecommendationResult;
import org.springframework.stereotype.Component;

import java.util.HashMap;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;

@Component
public class GeminiResponseParser {

    private static final String DEFAULT_VALUE = "없음";

    public Optional<AiRecommendationResult> parse(String text) {
        if (text == null || text.isBlank()) {
            return Optional.empty();
        }

        Map<String, String> values = new HashMap<>();
        String[] lines = text.split("\\R");

        for (String raw : lines) {
            String line = raw == null ? "" : raw.trim();
            int idx = line.indexOf(':');
            if (idx <= 0) {
                continue;
            }

            String key = line.substring(0, idx).trim();
            String value = line.substring(idx + 1).trim();
            if (value.isBlank()) {
                value = DEFAULT_VALUE;
            }

            String normalized = normalizeKey(key);
            switch (normalized) {
                case "상의", "top" -> values.put("top", value);
                case "아우터", "outer" -> values.put("outer", value);
                case "하의", "bottom" -> values.put("bottom", value);
                case "신발", "shoes" -> values.put("shoes", value);
                case "액세서리", "악세서리", "accessory" -> values.put("accessory", value);
                case "코멘트", "comment", "summary" -> values.put("comment", value);
                default -> {
                }
            }
        }

        if (values.isEmpty()) {
            return Optional.empty();
        }

        return Optional.of(new AiRecommendationResult(
                values.getOrDefault("top", DEFAULT_VALUE),
                values.getOrDefault("outer", DEFAULT_VALUE),
                values.getOrDefault("bottom", DEFAULT_VALUE),
                values.getOrDefault("shoes", DEFAULT_VALUE),
                values.getOrDefault("accessory", DEFAULT_VALUE),
                values.getOrDefault("comment", DEFAULT_VALUE)
        ));
    }

    private String normalizeKey(String key) {
        return key.replace(" ", "")
                .replace("-", "")
                .replace("_", "")
                .toLowerCase(Locale.ROOT);
    }
}