package com.ootd.backend.ai.service;

import com.ootd.backend.survey.entity.OutingPurpose;
import com.ootd.backend.survey.entity.SurveyAnswer;
import com.ootd.backend.user.entity.BodyType;
import com.ootd.backend.user.entity.PersonalColor;
import com.ootd.backend.user.entity.User;
import com.ootd.backend.user.entity.UserProfile;
import com.ootd.backend.weather.entity.WeatherCache;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;

@Component
public class GeminiPromptBuilder {

    private static final String NOT_COLLECTED = "미수집";
    private static final String NONE = "없음";

    public String build(WeatherCache weather, User user, UserProfile profile, SurveyAnswer survey) {
        return String.join("\n",
                "너는 한국 날씨 기반 개인 맞춤 스타일 코디네이터다.",
                "아래 정보를 종합해 오늘 실제로 입기 좋은 현실적인 코디를 추천해라.",
                "출력 형식은 반드시 아래의 6줄 형식만 사용하고, 마크다운/코드블록/추가 설명은 쓰지 마라.",
                "",
                "[날씨 정보]",
                "- 날짜: " + value(weather.getTargetDate()),
                "- 지역: " + value(weather.getRegionCode()),
                "- 현재 기온: " + temperature(weather.getCurrentTemp()),
                "- 최고 기온: " + temperature(weather.getMaxTemp()),
                "- 최저 기온: " + temperature(weather.getMinTemp()),
                "- 날씨: " + value(weather.getWeatherMain()),
                "- 날씨 설명: " + value(weather.getWeatherDescription()),
                "- 강수확률: " + percentage(weather.getPrecipitationProbability()),
                "- 습도: " + percentage(weather.getHumidity()),
                "- 날씨 힌트: " + weatherHint(weather),
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
                "[추천 기준]",
                "- 사용자의 체형을 보완하거나 장점을 살리는 핏을 추천한다.",
                "- 퍼스널 컬러 정보가 있으면 어울리는 색상을 우선 추천한다.",
                "- 키와 몸무게 정보가 있으면 비율이 좋아 보이는 실루엣을 추천한다.",
                "- 선호 스타일을 우선 반영하되, 날씨와 TPO에 맞지 않으면 현실적인 대안을 제시한다.",
                "- 날씨와 기온, 강수확률을 반드시 반영한다.",
                "- 비 가능성이 높으면 신발/아우터 소재에 방수 또는 젖어도 부담이 적은 소재를 반영한다.",
                "- 일교차가 크면 아우터를 포함한다.",
                "- 더운 날씨에는 아우터를 \"없음\"으로 작성한다.",
                "- 각 아이템은 가능하면 핏 + 색상 + 아이템명 형태로 작성한다.",
                "- 필요 없는 항목은 \"없음\"으로 작성한다.",
                "- 한국어로만 응답한다.",
                "",
                "[출력 형식]",
                "상의: ...",
                "아우터: ...",
                "하의: ...",
                "신발: ...",
                "액세서리: ...",
                "코멘트: ..."
        );
    }

    private String weatherHint(WeatherCache weather) {
        if (isHotWeather(weather)) {
            return "더운 날씨이므로 통기성과 가벼운 소재를 우선하고 불필요한 아우터는 제외한다.";
        }
        if (isRainy(weather)) {
            return "비 가능성이 있으므로 젖어도 부담이 적은 신발과 방수 요소를 고려한다.";
        }
        if (isLargeDailyGap(weather)) {
            return "일교차가 큰 날씨이므로 벗고 입기 쉬운 가벼운 아우터를 포함한다.";
        }
        return "기온에 맞는 현실적인 레이어링을 적용한다.";
    }

    private boolean isHotWeather(WeatherCache weather) {
        BigDecimal current = weather.getCurrentTemp();
        BigDecimal max = weather.getMaxTemp();
        return (current != null && current.compareTo(BigDecimal.valueOf(25)) >= 0)
                || (max != null && max.compareTo(BigDecimal.valueOf(28)) >= 0);
    }

    private boolean isLargeDailyGap(WeatherCache weather) {
        if (weather.getMinTemp() == null || weather.getMaxTemp() == null) {
            return false;
        }
        return weather.getMaxTemp().subtract(weather.getMinTemp()).compareTo(BigDecimal.valueOf(10)) >= 0;
    }

    private boolean isRainy(WeatherCache weather) {
        BigDecimal pop = weather.getPrecipitationProbability();
        String desc = weather.getWeatherDescription() == null ? "" : weather.getWeatherDescription().toLowerCase();
        String main = weather.getWeatherMain() == null ? "" : weather.getWeatherMain().toLowerCase();
        return (pop != null && pop.compareTo(BigDecimal.valueOf(40)) >= 0)
                || desc.contains("비")
                || desc.contains("rain")
                || main.contains("rain");
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
