package com.ootd.backend.ai.service;

import com.ootd.backend.survey.entity.OutingPurpose;
import com.ootd.backend.survey.entity.SurveyAnswer;
import com.ootd.backend.user.entity.BodyType;
import com.ootd.backend.user.entity.Gender;
import com.ootd.backend.user.entity.PersonalColor;
import com.ootd.backend.user.entity.Role;
import com.ootd.backend.user.entity.User;
import com.ootd.backend.user.entity.UserProfile;
import com.ootd.backend.weather.entity.WeatherCache;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

import static org.assertj.core.api.Assertions.assertThat;

class GeminiPromptBuilderTest {

    private final GeminiPromptBuilder promptBuilder = new GeminiPromptBuilder();

    @Test
    void build_shouldContainStructuredSectionsAndInputData() {
        WeatherCache weather = WeatherCache.builder()
                .targetDate(LocalDate.of(2026, 4, 23))
                .regionCode("SEOUL")
                .weatherMain("Clouds")
                .weatherDescription("흐림")
                .precipitationProbability(new BigDecimal("20.00"))
                .minTemp(new BigDecimal("14.00"))
                .maxTemp(new BigDecimal("24.00"))
                .currentTemp(new BigDecimal("20.50"))
                .humidity(new BigDecimal("55.00"))
                .fetchedAt(LocalDateTime.now())
                .build();

        User user = User.builder()
                .email("user@example.com")
                .password("encoded")
                .nickname("tester")
                .gender(Gender.MALE)
                .role(Role.USER)
                .isActive(true)
                .build();

        UserProfile profile = UserProfile.builder()
                .user(user)
                .personalColor(PersonalColor.SPRING_WARM)
                .bodyType(BodyType.NORMAL)
                .preferredStyle("댄디")
                .profileImageUrl(null)
                .build();

        SurveyAnswer survey = SurveyAnswer.builder()
                .userId(1L)
                .surveyDate(LocalDate.of(2026, 4, 23))
                .outingPurpose(OutingPurpose.DATE)
                .notes("댄디한 무드")
                .build();

        String prompt = promptBuilder.build(weather, user, profile, survey);

        assertThat(prompt).contains("1. 역할 정의");
        assertThat(prompt).contains("2. 규칙 정의");
        assertThat(prompt).contains("3. 날씨 정보");
        assertThat(prompt).contains("4. 사용자 정보");
        assertThat(prompt).contains("5. 출력 형식");

        assertThat(prompt).contains("- 지역: SEOUL");
        assertThat(prompt).contains("- 성별: MALE");
        assertThat(prompt).contains("- 외출 목적: 데이트");
        assertThat(prompt).contains("- 퍼스널 컬러: SPRING_WARM");
        assertThat(prompt).contains("- 체형: NORMAL");
        assertThat(prompt).contains("- 추가 메모: 댄디한 무드");

        assertThat(prompt).contains("상의: ...");
        assertThat(prompt).contains("아우터: ...");
        assertThat(prompt).contains("코멘트: ...");
    }

    @Test
    void build_shouldUseFallbackTextWhenSurveyAndProfileMissing() {
        WeatherCache weather = WeatherCache.builder()
                .targetDate(LocalDate.of(2026, 4, 23))
                .regionCode("SEOUL")
                .weatherMain("Clouds")
                .weatherDescription("흐림")
                .minTemp(new BigDecimal("14.00"))
                .maxTemp(new BigDecimal("24.00"))
                .fetchedAt(LocalDateTime.now())
                .build();

        User user = User.builder()
                .email("user@example.com")
                .password("encoded")
                .nickname("tester")
                .gender(Gender.FEMALE)
                .role(Role.USER)
                .isActive(true)
                .build();

        String prompt = promptBuilder.build(weather, user, null, null);

        assertThat(prompt).contains("- 외출 목적: 미수집");
        assertThat(prompt).contains("- 퍼스널 컬러: UNKNOWN");
        assertThat(prompt).contains("- 체형: UNKNOWN");
        assertThat(prompt).contains("- 추가 메모: 없음");
        assertThat(prompt).contains("- 현재 기온: 없음");
    }
}