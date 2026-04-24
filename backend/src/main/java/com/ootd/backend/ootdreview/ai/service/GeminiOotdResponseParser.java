package com.ootd.backend.ootdreview.ai.service;

import com.ootd.backend.ootdreview.ai.dto.OotdEvaluationResult;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.HashMap;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;

@Component
public class GeminiOotdResponseParser {

    private static final String DEFAULT_TEXT = "없음";

    public Optional<OotdEvaluationResult> parse(String rawText) {
        String text = normalize(rawText);
        if (text.isBlank()) {
            return Optional.empty();
        }

        Map<String, String> values = new HashMap<>();
        for (String line : text.split("\\R")) {
            int idx = line.indexOf(':');
            if (idx <= 0) {
                continue;
            }
            String key = normalizeKey(line.substring(0, idx));
            String value = line.substring(idx + 1).trim();
            if (!value.isBlank()) {
                values.put(key, value);
            }
        }

        if (!values.containsKey("rating")) {
            return Optional.empty();
        }

        BigDecimal rating = parseRating(values.get("rating"));
        String fit = values.getOrDefault("fitfeedback", DEFAULT_TEXT);
        String color = values.getOrDefault("colorfeedback", DEFAULT_TEXT);
        String overall = values.getOrDefault("overallfeedback", DEFAULT_TEXT);
        String modelVersion = values.getOrDefault("aimodelversion", "gemini-2.5-flash");

        return Optional.of(new OotdEvaluationResult(
                rating,
                limit(fit, 500),
                limit(color, 500),
                limit(overall, 1000),
                limit(modelVersion, 100)
        ));
    }

    private BigDecimal parseRating(String raw) {
        try {
            String normalized = raw.replaceAll("[^0-9.\\-]", "");
            BigDecimal parsed = new BigDecimal(normalized);
            if (parsed.compareTo(BigDecimal.ZERO) < 0) {
                parsed = BigDecimal.ZERO;
            }
            if (parsed.compareTo(BigDecimal.valueOf(5.0)) > 0) {
                parsed = BigDecimal.valueOf(5.0);
            }
            return parsed.setScale(1, RoundingMode.HALF_UP);
        } catch (Exception ex) {
            return BigDecimal.valueOf(4.0);
        }
    }

    private String normalize(String rawText) {
        if (rawText == null) {
            return "";
        }
        String normalized = rawText.replace("\r\n", "\n")
                .replace("\r", "\n")
                .replace("```", "");

        StringBuilder cleaned = new StringBuilder();
        for (String line : normalized.split("\n")) {
            String trimmed = line == null ? "" : line.trim();
            if (trimmed.startsWith("- ")) {
                trimmed = trimmed.substring(2).trim();
            }
            if (trimmed.isBlank()) {
                continue;
            }
            if (!cleaned.isEmpty()) {
                cleaned.append('\n');
            }
            cleaned.append(trimmed);
        }
        return cleaned.toString().trim();
    }

    private String normalizeKey(String key) {
        return key == null ? "" : key.replace(" ", "")
                .replace("-", "")
                .replace("_", "")
                .toLowerCase(Locale.ROOT);
    }

    private String limit(String value, int maxLen) {
        if (value == null || value.isBlank()) {
            return DEFAULT_TEXT;
        }
        String trimmed = value.trim();
        if (trimmed.length() <= maxLen) {
            return trimmed;
        }
        return trimmed.substring(0, maxLen);
    }
}
