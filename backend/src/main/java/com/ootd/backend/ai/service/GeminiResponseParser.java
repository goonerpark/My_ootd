package com.ootd.backend.ai.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.ootd.backend.ai.dto.AiRecommendationResult;
import org.springframework.stereotype.Component;

import java.util.HashMap;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;

@Component
public class GeminiResponseParser {

    private static final String DEFAULT_VALUE = "없음";
    private final ObjectMapper objectMapper = new ObjectMapper();

    public Optional<AiRecommendationResult> parse(String text) {
        if (text == null || text.isBlank()) {
            return Optional.empty();
        }

        Optional<AiRecommendationResult> jsonParsed = parseJson(text);
        if (jsonParsed.isPresent()) {
            return jsonParsed;
        }

        return parseLineFormat(text);
    }

    private Optional<AiRecommendationResult> parseJson(String text) {
        String json = extractJsonObject(text);
        if (json.isBlank()) {
            return Optional.empty();
        }

        try {
            JsonNode node = objectMapper.readTree(json);
            if (!node.isObject()) {
                return Optional.empty();
            }

            Map<String, String> values = new HashMap<>();
            putJsonValue(values, "top", node, "top", "topItem", "상의");
            putJsonValue(values, "outer", node, "outer", "outerItem", "outerwear", "아우터");
            putJsonValue(values, "bottom", node, "bottom", "bottomItem", "bottoms", "하의");
            putJsonValue(values, "shoes", node, "shoes", "shoesItem", "신발");
            putJsonValue(values, "accessory", node, "accessory", "accessoryItem", "accessories", "액세서리", "악세서리");
            putJsonValue(values, "comment", node, "comment", "summary", "summaryComment", "코멘트", "설명");

            if (values.isEmpty()) {
                return Optional.empty();
            }

            return Optional.of(toResult(values));
        } catch (Exception ignored) {
            return Optional.empty();
        }
    }

    private Optional<AiRecommendationResult> parseLineFormat(String text) {
        Map<String, String> values = new HashMap<>();
        String[] lines = text.split("\\R");

        for (String raw : lines) {
            String line = raw == null ? "" : raw.trim();
            int idx = line.indexOf(':');
            if (idx <= 0) {
                continue;
            }

            String key = normalizeKey(line.substring(0, idx));
            String value = line.substring(idx + 1).trim();
            if (value.isBlank()) {
                value = DEFAULT_VALUE;
            }

            switch (key) {
                case "상의", "top", "topitem" -> values.put("top", value);
                case "아우터", "outer", "outeritem", "outerwear" -> values.put("outer", value);
                case "하의", "bottom", "bottomitem", "bottoms" -> values.put("bottom", value);
                case "신발", "shoes", "shoesitem" -> values.put("shoes", value);
                case "액세서리", "악세서리", "accessory", "accessoryitem", "accessories" -> values.put("accessory", value);
                case "코멘트", "설명", "comment", "summary", "summarycomment" -> values.put("comment", value);
                default -> {
                }
            }
        }

        if (values.isEmpty()) {
            return Optional.empty();
        }

        return Optional.of(toResult(values));
    }

    private AiRecommendationResult toResult(Map<String, String> values) {
        return new AiRecommendationResult(
                sanitize(values.get("top")),
                sanitize(values.get("outer")),
                sanitize(values.get("bottom")),
                sanitize(values.get("shoes")),
                sanitize(values.get("accessory")),
                sanitize(values.get("comment"))
        );
    }

    private void putJsonValue(Map<String, String> values, String targetKey, JsonNode node, String... aliases) {
        for (String alias : aliases) {
            JsonNode value = node.get(alias);
            if (value != null && !value.asText("").isBlank()) {
                values.put(targetKey, value.asText().trim());
                return;
            }
        }
    }

    private String extractJsonObject(String text) {
        String normalized = text.replace("```json", "")
                .replace("```JSON", "")
                .replace("```", "")
                .trim();
        int start = normalized.indexOf('{');
        int end = normalized.lastIndexOf('}');
        if (start < 0 || end <= start) {
            return "";
        }
        return normalized.substring(start, end + 1);
    }

    private String sanitize(String value) {
        if (value == null || value.isBlank()) {
            return DEFAULT_VALUE;
        }
        return value.trim();
    }

    private String normalizeKey(String key) {
        return key.replace(" ", "")
                .replace("-", "")
                .replace("_", "")
                .toLowerCase(Locale.ROOT)
                .trim();
    }
}
