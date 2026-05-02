package com.ootd.backend.ai.service;

import com.ootd.backend.ai.dto.AiRecommendationResult;
import org.junit.jupiter.api.Test;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;

class GeminiResponseParserTest {

    private final GeminiResponseParser parser = new GeminiResponseParser();

    @Test
    void parse_shouldMapKoreanLineKeys() {
        String text = String.join("\n",
                "상의: 화이트 코튼 셔츠",
                "아우터: 네이비 가디건",
                "하의: 그레이 슬랙스",
                "신발: 블랙 로퍼",
                "액세서리: 실버 시계",
                "코멘트: 단정한 코디를 추천합니다."
        );

        Optional<AiRecommendationResult> result = parser.parse(text);

        assertThat(result).isPresent();
        assertThat(result.get().top()).isEqualTo("화이트 코튼 셔츠");
        assertThat(result.get().outer()).isEqualTo("네이비 가디건");
        assertThat(result.get().bottom()).isEqualTo("그레이 슬랙스");
        assertThat(result.get().shoes()).isEqualTo("블랙 로퍼");
        assertThat(result.get().accessory()).isEqualTo("실버 시계");
        assertThat(result.get().comment()).isEqualTo("단정한 코디를 추천합니다.");
    }

    @Test
    void parse_shouldFillDefaultWhenSomeKeysMissing() {
        String text = String.join("\n",
                "상의: 반팔 셔츠",
                "하의: 반바지",
                "코멘트: 더운 날씨입니다."
        );

        Optional<AiRecommendationResult> result = parser.parse(text);

        assertThat(result).isPresent();
        assertThat(result.get().top()).isEqualTo("반팔 셔츠");
        assertThat(result.get().bottom()).isEqualTo("반바지");
        assertThat(result.get().outer()).isEqualTo("없음");
        assertThat(result.get().shoes()).isEqualTo("없음");
        assertThat(result.get().accessory()).isEqualTo("없음");
        assertThat(result.get().comment()).isEqualTo("더운 날씨입니다.");
    }

    @Test
    void parse_shouldMapJsonAliases() {
        String text = "{\"topItem\":\"블랙 니트\",\"outerItem\":\"없음\",\"bottomItem\":\"데님 팬츠\",\"shoesItem\":\"스니커즈\",\"accessoryItem\":\"볼캡\",\"summaryComment\":\"가벼운 룩입니다.\"}";

        Optional<AiRecommendationResult> result = parser.parse(text);

        assertThat(result).isPresent();
        assertThat(result.get().top()).isEqualTo("블랙 니트");
        assertThat(result.get().outer()).isEqualTo("없음");
        assertThat(result.get().bottom()).isEqualTo("데님 팬츠");
        assertThat(result.get().shoes()).isEqualTo("스니커즈");
        assertThat(result.get().accessory()).isEqualTo("볼캡");
        assertThat(result.get().comment()).isEqualTo("가벼운 룩입니다.");
    }
}