package com.ootd.backend.ai.service;

import com.ootd.backend.survey.entity.OutingPurpose;
import com.ootd.backend.survey.entity.SurveyAnswer;
import com.ootd.backend.user.entity.User;
import com.ootd.backend.user.entity.UserProfile;
import com.ootd.backend.weather.entity.WeatherCache;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;

@Component
public class GeminiPromptBuilder {

    public String build(WeatherCache weather, User user, UserProfile profile, SurveyAnswer survey) {
        String outingPurpose = survey == null ? "미수집" : outingPurposeLabel(survey.getOutingPurpose());
        String notes = (survey == null || survey.getNotes() == null || survey.getNotes().isBlank()) ? "없음" : survey.getNotes();
        String personalColor = profile == null || profile.getPersonalColor() == null ? "UNKNOWN" : profile.getPersonalColor().name();
        String bodyType = profile == null || profile.getBodyType() == null ? "UNKNOWN" : profile.getBodyType().name();

        String currentTemp = weather.getCurrentTemp() == null ? "없음" : weather.getCurrentTemp() + "°C";
        String precipitation = weather.getPrecipitationProbability() == null ? "없음" : weather.getPrecipitationProbability() + "%";
        String humidity = weather.getHumidity() == null ? "없음" : weather.getHumidity() + "%";

        boolean hotWeather = isHotWeather(weather);
        boolean largeGap = isLargeDailyGap(weather);
        boolean rainy = isRainy(weather);

        String weatherRuleHint = hotWeather
                ? "더운 날씨 조건입니다. 아우터는 반드시 '없음'으로 작성하세요."
                : (largeGap ? "일교차가 큰 날씨 조건입니다. 아우터를 반드시 포함하세요." : "기온에 맞는 현실적인 레이어링을 적용하세요.");

        String rainRuleHint = rainy
                ? "비/강수 가능성이 있습니다. 신발은 미끄럼/방수/관리 용이성을 고려해 작성하세요."
                : "강수 영향이 낮습니다. 일반적인 신발 추천이 가능합니다.";

        return String.join("\n",
                "1. 역할 정의",
                "너는 한국 날씨 기반 스타일 코디네이터다. 각 아이템을 단순 명칭이 아닌 '핏 + 색상 + 아이템명'으로 추천한다.",
                "",
                "2. 규칙 정의",
                "- 반드시 지정된 출력 형식으로만 답변해라.",
                "- 각 항목은 한 줄로 작성해라.",
                "- 불필요한 설명, 인사말, 마크다운을 쓰지 마라.",
                "- 필요 없는 항목은 반드시 '없음'으로 작성해라.",
                "- 날씨와 기온을 반드시 고려해라.",
                "- 각 아이템은 가능하면 '핏 + 색상 + 아이템명' 형태로 작성해라.",
                "- 예: 레귤러핏의 블랙 티셔츠 / 세미 와이드핏의 연청 데님 팬츠",
                "- 신발과 액세서리는 색상 또는 분위기가 드러나게 작성해라.",
                "- 퍼스널 컬러 정보가 있으면 색상 선택에 반영해라.",
                "- 체형 정보가 있으면 핏 선택에 반영해라.",
                "- 더운 날씨면 아우터는 반드시 '없음'으로 작성해라.",
                "- 일교차가 크면 아우터를 반드시 포함해라.",
                "- 비 예보가 있으면 신발 선택에 반영해라.",
                "- 한국어로만 답변해라.",
                "- 출력 형식을 절대 변경하지 마라.",
                "",
                "3. 날씨 정보",
                "- 날짜: " + weather.getTargetDate(),
                "- 지역: " + weather.getRegionCode(),
                "- 현재 기온: " + currentTemp,
                "- 최고 기온: " + weather.getMaxTemp() + "°C",
                "- 최저 기온: " + weather.getMinTemp() + "°C",
                "- 날씨 설명: " + weather.getWeatherDescription(),
                "- 강수확률: " + precipitation,
                "- 습도: " + humidity,
                "- 날씨 규칙 힌트: " + weatherRuleHint,
                "- 강수 규칙 힌트: " + rainRuleHint,
                "",
                "4. 사용자 정보",
                "- 성별: " + user.getGender().name(),
                "- 외출 목적: " + outingPurpose,
                "- 외출 시간: 미수집(추후 확장)",
                "- 이동량: 미수집(추후 확장)",
                "- 스타일 분위기: 미수집(추후 확장)",
                "- 추위 민감도: 미수집(추후 확장)",
                "- 퍼스널 컬러: " + personalColor,
                "- 체형: " + bodyType,
                "- 추가 메모: " + notes,
                "",
                "5. 출력 형식",
                "상의: ...",
                "아우터: ...",
                "하의: ...",
                "신발: ...",
                "액세서리: ...",
                "코멘트: ...",
                "",
                "출력 예시",
                "상의: 레귤러핏의 블랙 티셔츠",
                "아우터: 레귤러핏의 네이비 블루종",
                "하의: 세미 와이드핏의 연청 데님 팬츠",
                "신발: 블랙 로퍼",
                "액세서리: 심플한 실버 팔찌 또는 착용하지 않음",
                "코멘트: 일교차가 있어 가벼운 아우터를 함께 입는 것이 좋습니다."
        );
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
        return (pop != null && pop.compareTo(BigDecimal.valueOf(40)) >= 0)
                || desc.contains("비")
                || desc.contains("rain");
    }

    private String outingPurposeLabel(OutingPurpose purpose) {
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
}