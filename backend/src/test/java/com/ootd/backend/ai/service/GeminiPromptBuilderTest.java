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
    void build_shouldContainPersonalizedWeatherSurveySectionsAndOutputFormat() {
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
                .heightCm(new BigDecimal("172.5"))
                .weightKg(new BigDecimal("65.0"))
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

        assertThat(prompt).contains("[날씨 정보]");
        assertThat(prompt).contains("[사용자 정보]");
        assertThat(prompt).contains("[오늘 설문 정보]");
        assertThat(prompt).contains("[추천 기준]");
        assertThat(prompt).contains("[출력 형식]");

        assertThat(prompt).contains("- 지역: SEOUL");
        assertThat(prompt).contains("- 현재 기온: 20.50°C");
        assertThat(prompt).contains("- 성별: MALE");
        assertThat(prompt).contains("- 닉네임: tester");
        assertThat(prompt).contains("- 체형: 보통");
        assertThat(prompt).contains("- 퍼스널 컬러: 봄 웜톤");
        assertThat(prompt).contains("- 키: 172.5cm");
        assertThat(prompt).contains("- 몸무게: 65.0kg");
        assertThat(prompt).contains("- 선호 스타일: 댄디");
        assertThat(prompt).contains("- 외출 목적: 데이트");
        assertThat(prompt).contains("- 추가 메모: 댄디한 무드");

        assertThat(prompt).contains("상의: ...");
        assertThat(prompt).contains("아우터: ...");
        assertThat(prompt).contains("하의: ...");
        assertThat(prompt).contains("신발: ...");
        assertThat(prompt).contains("액세서리: ...");
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

        assertThat(prompt).contains("- 성별: FEMALE");
        assertThat(prompt).contains("- 체형: 미수집");
        assertThat(prompt).contains("- 퍼스널 컬러: 미수집");
        assertThat(prompt).contains("- 키: 미수집");
        assertThat(prompt).contains("- 몸무게: 미수집");
        assertThat(prompt).contains("- 선호 스타일: 미수집");
        assertThat(prompt).contains("- 외출 목적: 미수집");
        assertThat(prompt).contains("- 추가 메모: 없음");
        assertThat(prompt).contains("- 현재 기온: 미수집");
    }
}