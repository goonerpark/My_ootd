package com.ootd.backend.ai.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.ootd.backend.ai.config.GeminiProperties;
import com.ootd.backend.ai.dto.AiRecommendationResult;
import com.ootd.backend.survey.entity.SurveyAnswer;
import com.ootd.backend.user.entity.Gender;
import com.ootd.backend.user.entity.User;
import com.ootd.backend.user.entity.UserProfile;
import com.ootd.backend.weather.entity.WeatherCache;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.util.List;
import java.util.HashMap;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;

@Service
@Slf4j
@RequiredArgsConstructor
public class GeminiRecommendationService {

    private final GeminiProperties geminiProperties;
    private final RestClient restClient;
    private final GeminiPromptBuilder promptBuilder;
    private final GeminiResponseParser responseParser;
    private final ObjectMapper objectMapper;

    public Optional<AiRecommendationResult> recommend(WeatherCache weather, User user, UserProfile profile, SurveyAnswer survey) {
        if (!geminiProperties.isEnabled()) {
            log.debug("Gemini is disabled. AI recommendation is unavailable.");
            return Optional.empty();
        }
        if (geminiProperties.getApiKey() == null || geminiProperties.getApiKey().isBlank()) {
            log.warn("GEMINI_API_KEY is empty. AI recommendation is unavailable.");
            return Optional.empty();
        }

        try {
            String prompt = promptBuilder.build(weather, user, profile, survey);
            Map<String, Object> requestBody = buildRequestBody(prompt);
            JsonNode response = restClient.post()
                    .uri(Objects.requireNonNull(buildEndpoint()))
                    .contentType(Objects.requireNonNull(MediaType.APPLICATION_JSON))
                    .body(Objects.requireNonNull(requestBody))
                    .retrieve()
                    .body(JsonNode.class);

            String text = extractText(response);
            Optional<AiRecommendationResult> parsed = responseParser.parse(normalizeForParsing(text));
            if (parsed.isEmpty()) {
                log.warn("Gemini response parsing failed. Raw text: {}", text);
            } else {
                log.info("Gemini recommendation generated successfully for date={}", weather.getTargetDate());
            }
            return parsed;
        } catch (Exception ex) {
            log.warn("Gemini API call failed. AI recommendation is unavailable.", ex);
            return Optional.empty();
        }
    }

    public Map<Gender, AiRecommendationResult> recommendGuestPair(WeatherCache weather) {
        if (!geminiProperties.isEnabled()) {
            log.debug("Gemini is disabled. Guest pair recommendation is unavailable.");
            return Map.of();
        }
        if (geminiProperties.getApiKey() == null || geminiProperties.getApiKey().isBlank()) {
            log.warn("GEMINI_API_KEY is empty. Guest pair recommendation is unavailable.");
            return Map.of();
        }

        try {
            String prompt = buildGuestPairPrompt(weather);
            Map<String, Object> requestBody = buildRequestBody(prompt);
            JsonNode response = restClient.post()
                    .uri(Objects.requireNonNull(buildEndpoint()))
                    .contentType(Objects.requireNonNull(MediaType.APPLICATION_JSON))
                    .body(Objects.requireNonNull(requestBody))
                    .retrieve()
                    .body(JsonNode.class);

            Map<Gender, AiRecommendationResult> parsed = parseGuestPair(extractText(response));
            if (parsed.isEmpty()) {
                log.warn("Gemini guest pair response parsing failed.");
            } else {
                log.info("Gemini guest pair recommendation generated successfully for date={}", weather.getTargetDate());
            }
            return parsed;
        } catch (Exception ex) {
            log.warn("Gemini guest pair API call failed. Guest fallback recommendation will be used.", ex);
            return Map.of();
        }
    }

    private String buildEndpoint() {
        return geminiProperties.getBaseUrl()
                + "/v1beta/models/"
                + geminiProperties.getModel()
                + ":generateContent?key="
                + geminiProperties.getApiKey();
    }

    private Map<String, Object> buildRequestBody(String prompt) {
        return Map.of(
                "contents", List.of(
                        Map.of("parts", List.of(Map.of("text", prompt)))
                ),
                "generationConfig", Map.of(
                        "temperature", 0.2,
                        "topK", 40,
                        "topP", 0.9
                )
        );
    }

    private String buildGuestPairPrompt(WeatherCache weather) {
        return String.join("\n",
                "You are a Korean weather-based fashion stylist.",
                "Generate recommendations for both MALE and FEMALE in a single response.",
                "Return JSON object only. Do not use markdown, code blocks, or extra explanations.",
                "All item values and comments must be written in Korean.",
                "",
                "[Weather]",
                "- date: " + weather.getTargetDate(),
                "- regionCode: " + weather.getRegionCode(),
                "- weatherMain: " + weather.getWeatherMain(),
                "- weatherDescription: " + weather.getWeatherDescription(),
                "- currentTemp: " + weather.getCurrentTemp(),
                "- minTemp: " + weather.getMinTemp(),
                "- maxTemp: " + weather.getMaxTemp(),
                "- precipitationProbability: " + weather.getPrecipitationProbability(),
                "- humidity: " + weather.getHumidity(),
                "",
                "[Rules]",
                "- Reflect weather, temperature, humidity, and precipitation probability.",
                "- Include fit + color + item name whenever possible.",
                "- If it is hot, set outerItem to \"없음\".",
                "- If the daily temperature gap is large, include a light outerItem.",
                "- If rain probability is high, reflect water-resistant outerwear or shoes.",
                "- Keep outfits realistic for daily wear.",
                "- Make MALE and FEMALE recommendations meaningfully different.",
                "",
                "[Output JSON]",
                "{",
                "  \"MALE\": {",
                "    \"topItem\": \"...\",",
                "    \"outerItem\": \"...\",",
                "    \"bottomItem\": \"...\",",
                "    \"shoesItem\": \"...\",",
                "    \"accessoryItem\": \"...\",",
                "    \"comment\": \"...\"",
                "  },",
                "  \"FEMALE\": {",
                "    \"topItem\": \"...\",",
                "    \"outerItem\": \"...\",",
                "    \"bottomItem\": \"...\",",
                "    \"shoesItem\": \"...\",",
                "    \"accessoryItem\": \"...\",",
                "    \"comment\": \"...\"",
                "  }",
                "}"
        );
    }

    private Map<Gender, AiRecommendationResult> parseGuestPair(String text) {
        String json = extractJsonObject(text);
        if (json.isBlank()) {
            return Map.of();
        }

        try {
            JsonNode root = objectMapper.readTree(json);
            Map<Gender, AiRecommendationResult> results = new HashMap<>();
            for (Gender gender : Gender.values()) {
                JsonNode node = root.get(gender.name());
                if (node == null) {
                    node = root.get(gender.name().toLowerCase());
                }
                if (node != null && node.isObject()) {
                    results.put(gender, new AiRecommendationResult(
                            sanitize(textValue(node, "topItem", "top")),
                            sanitize(textValue(node, "outerItem", "outer", "outerwear")),
                            sanitize(textValue(node, "bottomItem", "bottom", "bottoms")),
                            sanitize(textValue(node, "shoesItem", "shoes")),
                            sanitize(textValue(node, "accessoryItem", "accessory", "accessories")),
                            sanitize(textValue(node, "comment", "summary", "summaryComment"))
                    ));
                }
            }
            return results;
        } catch (Exception ex) {
            log.warn("Failed to parse Gemini guest pair JSON.", ex);
            return Map.of();
        }
    }

    private String extractJsonObject(String text) {
        if (text == null) {
            return "";
        }
        String normalized = normalizeForParsing(text);
        int start = normalized.indexOf('{');
        int end = normalized.lastIndexOf('}');
        if (start < 0 || end <= start) {
            return "";
        }
        return normalized.substring(start, end + 1);
    }

    private String textValue(JsonNode node, String... keys) {
        for (String key : keys) {
            JsonNode value = node.get(key);
            if (value != null && !value.asText("").isBlank()) {
                return value.asText().trim();
            }
        }
        return "";
    }

    private String sanitize(String value) {
        if (value == null || value.isBlank()) {
            return "없음";
        }
        return value.trim();
    }

    private String extractText(JsonNode response) {
        if (response == null) {
            return "";
        }

        JsonNode parts = response.path("candidates").path(0).path("content").path("parts");
        if (!parts.isArray()) {
            return "";
        }

        StringBuilder builder = new StringBuilder();
        for (JsonNode part : parts) {
            String text = part.path("text").asText("");
            if (!text.isBlank()) {
                if (!builder.isEmpty()) {
                    builder.append("\n");
                }
                builder.append(text.trim());
            }
        }
        return builder.toString();
    }

    private String normalizeForParsing(String text) {
        if (text == null) {
            return "";
        }

        String normalized = text.replace("\r\n", "\n")
                .replace("\r", "\n")
                .replace("```json", "")
                .replace("```JSON", "")
                .replace("```", "");

        StringBuilder cleaned = new StringBuilder();
        for (String rawLine : normalized.split("\n")) {
            String line = rawLine == null ? "" : rawLine.trim();
            if (line.startsWith("- ")) {
                line = line.substring(2).trim();
            }
            if (!line.isBlank()) {
                if (!cleaned.isEmpty()) {
                    cleaned.append("\n");
                }
                cleaned.append(line);
            }
        }
        return cleaned.toString().trim();
    }
}
