package com.ootd.backend.ai.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.ootd.backend.ai.config.GeminiProperties;
import com.ootd.backend.ai.dto.AiRecommendationResult;
import com.ootd.backend.survey.entity.OutingPurpose;
import com.ootd.backend.survey.entity.SurveyAnswer;
import com.ootd.backend.user.entity.BodyType;
import com.ootd.backend.user.entity.PersonalColor;
import com.ootd.backend.user.entity.User;
import com.ootd.backend.user.entity.UserProfile;
import com.ootd.backend.weather.entity.WeatherCache;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;

@Service
@Slf4j
@RequiredArgsConstructor
public class GeminiWeeklyRecommendationService {

    private static final String NOT_COLLECTED = "미수집";
    private static final String NONE = "없음";

    private final GeminiProperties geminiProperties;
    private final RestClient restClient;
    private final ObjectMapper objectMapper;

    public Map<LocalDate, AiRecommendationResult> recommendWeekly(
            List<WeatherCache> weatherCaches,
            User user,
            UserProfile profile,
            SurveyAnswer survey
    ) {
        if (!geminiProperties.isEnabled()) {
            log.debug("Gemini is disabled. Weekly fallback recommendation will be used.");
            return Map.of();
        }
        if (geminiProperties.getApiKey() == null || geminiProperties.getApiKey().isBlank()) {
            log.warn("GEMINI_API_KEY is empty. Weekly fallback recommendation will be used.");
            return Map.of();
        }
        if (weatherCaches == null || weatherCaches.isEmpty()) {
            return Map.of();
        }

        try {
            String prompt = buildPrompt(weatherCaches, user, profile, survey);
            Map<String, Object> requestBody = buildRequestBody(prompt);
            JsonNode response = restClient.post()
                    .uri(Objects.requireNonNull(buildEndpoint()))
                    .contentType(Objects.requireNonNull(MediaType.APPLICATION_JSON))
                    .body(Objects.requireNonNull(requestBody))
                    .retrieve()
                    .body(JsonNode.class);

            Map<LocalDate, AiRecommendationResult> parsed = parseRecommendations(extractText(response));
            if (parsed.isEmpty()) {
                log.warn("Gemini weekly response parsing failed. Weekly fallback recommendation will be used.");
            } else {
                log.info("Gemini weekly recommendation generated successfully. days={}", parsed.size());
            }
            return parsed;
        } catch (Exception ex) {
            log.warn("Gemini weekly API call failed. Weekly fallback recommendation will be used.", ex);
            return Map.of();
        }
    }

    private String buildPrompt(List<WeatherCache> weatherCaches, User user, UserProfile profile, SurveyAnswer survey) {
        StringBuilder weatherBlock = new StringBuilder();
        for (WeatherCache weather : weatherCaches) {
            weatherBlock.append("- targetDate: ").append(weather.getTargetDate()).append('\n')
                    .append("  regionCode: ").append(value(weather.getRegionCode())).append('\n')
                    .append("  weatherMain: ").append(value(weather.getWeatherMain())).append('\n')
                    .append("  weatherDescription: ").append(value(weather.getWeatherDescription())).append('\n')
                    .append("  dayTemp: ").append(temperature(dayTemp(weather))).append('\n')
                    .append("  currentTemp: ").append(temperature(weather.getCurrentTemp())).append('\n')
                    .append("  minTemp: ").append(temperature(weather.getMinTemp())).append('\n')
                    .append("  maxTemp: ").append(temperature(weather.getMaxTemp())).append('\n')
                    .append("  precipitationProbability: ").append(percentage(weather.getPrecipitationProbability())).append('\n')
                    .append("  humidity: ").append(percentage(weather.getHumidity())).append("\n\n");
        }

        return String.join("\n",
                "너는 한국 날씨 기반 개인 맞춤 스타일 코디네이터다.",
                "아래 날짜별 날씨와 사용자 정보를 종합해 각 날짜에 실제로 입기 좋은 현실적인 코디를 추천해라.",
                "반드시 JSON 배열만 반환해라. 마크다운, 설명, 코드블록은 절대 쓰지 마라.",
                "",
                "[사용자 정보]",
                "- 성별: " + gender(user),
                "- 닉네임: " + nickname(user),
                "- 체형: " + bodyType(profile),
                "- 퍼스널 컬러: " + personalColor(profile),
                "- 키: " + height(profile),
                "- 몸무게: " + weight(profile),
                "- 선호 스타일: " + preferredStyle(profile),
                "- 추위 민감도: " + NOT_COLLECTED,
                "",
                "[오늘 설문 정보]",
                "- 외출 목적: " + outingPurposeLabel(survey == null ? null : survey.getOutingPurpose()),
                "- 외출 시간: " + NOT_COLLECTED,
                "- 이동량: " + NOT_COLLECTED,
                "- 원하는 스타일 분위기: " + NOT_COLLECTED,
                "- 추가 메모: " + notes(survey),
                "",
                "[날짜별 날씨 정보]",
                weatherBlock.toString().trim(),
                "",
                "[추천 기준]",
                "- 사용자의 체형을 보완하거나 장점을 살리는 핏을 추천한다.",
                "- 퍼스널 컬러 정보가 있으면 어울리는 색상을 우선 추천한다.",
                "- 키와 몸무게 정보가 있으면 비율이 좋아 보이는 실루엣을 추천한다.",
                "- 선호 스타일과 외출 목적을 반영한다.",
                "- 날씨와 기온, 강수확률을 반드시 반영한다.",
                "- 비 가능성이 높으면 신발/아우터 소재를 고려한다.",
                "- 일교차가 큰 날은 outerItem을 포함한다.",
                "- 더운 날씨에는 outerItem을 \"없음\"으로 작성한다.",
                "- 각 아이템은 가능하면 핏 + 색상 + 아이템명 형태로 작성한다.",
                "- 날짜별 날씨 차이를 반영해서 같은 추천을 반복하지 않는다.",
                "- 한국어로만 추천한다.",
                "- 출력 JSON key 이름은 절대 변경하지 않는다.",
                "",
                "[출력 형식 예시]",
                "[",
                "  {",
                "    \"targetDate\": \"2026-04-28\",",
                "    \"topItem\": \"레귤러 핏의 블랙 긴팔 티셔츠\",",
                "    \"outerItem\": \"가벼운 네이비 바람막이\",",
                "    \"bottomItem\": \"세미 와이드핏의 연청 데님 팬츠\",",
                "    \"shoesItem\": \"블랙 로퍼\",",
                "    \"accessoryItem\": \"실버 팔찌 또는 없음\",",
                "    \"comment\": \"일교차가 있어 얇은 아우터를 챙기는 것이 좋습니다.\"",
                "  }",
                "]"
        );
    }

    private Map<LocalDate, AiRecommendationResult> parseRecommendations(String text) {
        Map<LocalDate, AiRecommendationResult> results = new HashMap<>();
        String jsonArray = extractJsonArray(text);
        if (jsonArray.isBlank()) {
            return results;
        }

        try {
            JsonNode root = objectMapper.readTree(jsonArray);
            if (!root.isArray()) {
                return results;
            }

            for (JsonNode node : root) {
                String targetDate = textValue(node, "targetDate");
                if (targetDate.isBlank()) {
                    continue;
                }
                results.put(
                        LocalDate.parse(targetDate),
                        new AiRecommendationResult(
                                sanitize(textValue(node, "topItem")),
                                sanitize(textValue(node, "outerItem")),
                                sanitize(textValue(node, "bottomItem")),
                                sanitize(textValue(node, "shoesItem")),
                                sanitize(textValue(node, "accessoryItem")),
                                sanitize(textValue(node, "comment"))
                        )
                );
            }
        } catch (Exception ex) {
            log.warn("Failed to parse Gemini weekly JSON array. Weekly fallback recommendation will be used.", ex);
            return Map.of();
        }

        return results;
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
                        "temperature", 0.45,
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
                    builder.append('\n');
                }
                builder.append(text.trim());
            }
        }
        return builder.toString();
    }

    private String extractJsonArray(String text) {
        if (text == null) {
            return "";
        }
        String normalized = text.replace("```json", "")
                .replace("```JSON", "")
                .replace("```", "")
                .trim();
        int start = normalized.indexOf('[');
        int end = normalized.lastIndexOf(']');
        if (start < 0 || end <= start) {
            return "";
        }
        return normalized.substring(start, end + 1);
    }

    private BigDecimal dayTemp(WeatherCache weather) {
        if (weather.getCurrentTemp() != null) {
            return weather.getCurrentTemp();
        }
        return weather.getMinTemp()
                .add(weather.getMaxTemp())
                .divide(BigDecimal.valueOf(2), 2, RoundingMode.HALF_UP);
    }

    private String textValue(JsonNode node, String key) {
        JsonNode value = node.get(key);
        return value == null ? "" : value.asText("").trim();
    }

    private String sanitize(String value) {
        return value == null || value.isBlank() ? NONE : value.trim();
    }

    private String gender(User user) {
        return user == null || user.getGender() == null ? NOT_COLLECTED : user.getGender().name();
    }

    private String nickname(User user) {
        return user == null || isBlank(user.getNickname()) ? NOT_COLLECTED : user.getNickname();
    }

    private String personalColor(UserProfile profile) {
        if (profile == null || profile.getPersonalColor() == null || profile.getPersonalColor() == PersonalColor.UNKNOWN) {
            return NOT_COLLECTED;
        }
        return switch (profile.getPersonalColor()) {
            case SPRING_WARM -> "봄 웜톤";
            case SUMMER_COOL -> "여름 쿨톤";
            case AUTUMN_WARM -> "가을 웜톤";
            case WINTER_COOL -> "겨울 쿨톤";
            case UNKNOWN -> NOT_COLLECTED;
        };
    }

    private String bodyType(UserProfile profile) {
        if (profile == null || profile.getBodyType() == null || profile.getBodyType() == BodyType.UNKNOWN) {
            return NOT_COLLECTED;
        }
        return switch (profile.getBodyType()) {
            case SLIM -> "슬림";
            case NORMAL -> "보통";
            case MUSCULAR -> "근육형";
            case CHUBBY -> "통통한 체형";
            case UNKNOWN -> NOT_COLLECTED;
        };
    }

    private String height(UserProfile profile) {
        return profile == null || profile.getHeightCm() == null ? NOT_COLLECTED : profile.getHeightCm() + "cm";
    }

    private String weight(UserProfile profile) {
        return profile == null || profile.getWeightKg() == null ? NOT_COLLECTED : profile.getWeightKg() + "kg";
    }

    private String preferredStyle(UserProfile profile) {
        return profile == null || isBlank(profile.getPreferredStyle()) ? NOT_COLLECTED : profile.getPreferredStyle();
    }

    private String notes(SurveyAnswer survey) {
        return survey == null || isBlank(survey.getNotes()) ? NONE : survey.getNotes();
    }

    private String outingPurposeLabel(OutingPurpose purpose) {
        if (purpose == null) {
            return NOT_COLLECTED;
        }
        return switch (purpose) {
            case WORK -> "출근";
            case SCHOOL -> "등교";
            case DATE -> "데이트";
            case EXERCISE -> "운동";
            case FORMAL -> "격식 있는 자리";
            case TRAVEL -> "여행";
            case CASUAL -> "가벼운 외출";
            case QUICK_OUTING -> "잠깐 외출";
        };
    }

    private String temperature(BigDecimal value) {
        return value == null ? NOT_COLLECTED : value + "°C";
    }

    private String percentage(BigDecimal value) {
        return value == null ? NOT_COLLECTED : value + "%";
    }

    private String value(Object value) {
        return value == null ? NOT_COLLECTED : String.valueOf(value);
    }

    private boolean isBlank(String value) {
        return value == null || value.isBlank();
    }
}
