package com.ootd.backend.ai.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.ootd.backend.ai.config.GeminiProperties;
import com.ootd.backend.ai.dto.AiRecommendationResult;
import com.ootd.backend.survey.entity.SurveyAnswer;
import com.ootd.backend.user.entity.User;
import com.ootd.backend.user.entity.UserProfile;
import com.ootd.backend.weather.entity.WeatherCache;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.util.List;
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
