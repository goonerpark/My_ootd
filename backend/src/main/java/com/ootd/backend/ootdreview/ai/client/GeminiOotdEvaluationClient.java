package com.ootd.backend.ootdreview.ai.client;

import com.fasterxml.jackson.databind.JsonNode;
import com.ootd.backend.ai.config.GeminiProperties;
import com.ootd.backend.ootdreview.ai.dto.OotdEvaluationResult;
import com.ootd.backend.ootdreview.ai.service.GeminiOotdPromptBuilder;
import com.ootd.backend.ootdreview.ai.service.GeminiOotdResponseParser;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Primary;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.ArrayList;
import java.util.Base64;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;

@Slf4j
@Primary
@Component
@RequiredArgsConstructor
public class GeminiOotdEvaluationClient implements OotdEvaluationClient {

    private final GeminiProperties geminiProperties;
    private final RestClient restClient;
    private final GeminiOotdPromptBuilder promptBuilder;
    private final GeminiOotdResponseParser responseParser;
    private final PlaceholderOotdEvaluationClient fallbackClient;

    @Override
    public OotdEvaluationResult evaluate(List<MultipartFile> imageFiles, String notes) {
        if (!geminiProperties.isEnabled()) {
            log.debug("Gemini is disabled. Placeholder fallback will be used.");
            return fallbackClient.evaluate(imageFiles, notes);
        }
        if (geminiProperties.getApiKey() == null || geminiProperties.getApiKey().isBlank()) {
            log.warn("GEMINI_API_KEY is empty. Placeholder fallback will be used.");
            return fallbackClient.evaluate(imageFiles, notes);
        }
        if (imageFiles == null || imageFiles.isEmpty()) {
            log.warn("No image files provided. Placeholder fallback will be used.");
            return fallbackClient.evaluate(imageFiles, notes);
        }

        try {
            String prompt = promptBuilder.build(notes);
            Map<String, Object> requestBody = buildRequestBody(prompt, imageFiles);
            JsonNode response = restClient.post()
                    .uri(Objects.requireNonNull(buildEndpoint()))
                    .contentType(Objects.requireNonNull(MediaType.APPLICATION_JSON))
                    .body(Objects.requireNonNull(requestBody))
                    .retrieve()
                    .body(JsonNode.class);

            String text = extractText(response);
            Optional<OotdEvaluationResult> parsed = responseParser.parse(text);
            if (parsed.isPresent()) {
                return parsed.get();
            }

            log.warn("Gemini OOTD response parsing failed. Raw text={}", text);
            return fallbackClient.evaluate(imageFiles, notes);
        } catch (Exception ex) {
            log.warn("Gemini OOTD evaluation failed. Placeholder fallback will be used.", ex);
            return fallbackClient.evaluate(imageFiles, notes);
        }
    }

    private String buildEndpoint() {
        return geminiProperties.getBaseUrl()
                + "/v1beta/models/"
                + geminiProperties.getModel()
                + ":generateContent?key="
                + geminiProperties.getApiKey();
    }

    private Map<String, Object> buildRequestBody(String prompt, List<MultipartFile> imageFiles) throws IOException {
        List<Map<String, Object>> parts = new ArrayList<>();
        parts.add(Map.of("text", prompt));

        for (MultipartFile imageFile : imageFiles) {
            if (imageFile == null || imageFile.isEmpty()) {
                continue;
            }

            String mimeType = resolveMimeType(imageFile);
            String base64Data = Base64.getEncoder().encodeToString(imageFile.getBytes());

            Map<String, Object> inlineData = new LinkedHashMap<>();
            inlineData.put("mimeType", mimeType);
            inlineData.put("data", base64Data);
            parts.add(Map.of("inlineData", inlineData));
        }

        return Map.of(
                "contents", List.of(
                        Map.of("parts", parts)
                ),
                "generationConfig", Map.of(
                        "temperature", 0.2,
                        "topK", 40,
                        "topP", 0.9
                )
        );
    }

    private String resolveMimeType(MultipartFile imageFile) {
        String contentType = imageFile.getContentType();
        if (contentType == null || contentType.isBlank()) {
            return "image/jpeg";
        }
        return contentType;
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
            if (text == null || text.isBlank()) {
                continue;
            }
            if (!builder.isEmpty()) {
                builder.append('\n');
            }
            builder.append(text.trim());
        }
        return builder.toString().trim();
    }
}
