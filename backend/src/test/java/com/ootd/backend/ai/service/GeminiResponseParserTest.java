package com.ootd.backend.ai.service;

import com.ootd.backend.ai.dto.AiRecommendationResult;
import org.junit.jupiter.api.Test;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;

class GeminiResponseParserTest {

    private final GeminiResponseParser parser = new GeminiResponseParser();

    @Test
    void parse_shouldMapKoreanKeys() {
        String text = String.join("\n",
                "상의: 셔츠",
                "아우터: 가디건",
                "하의: 슬랙스",
                "신발: 로퍼",
                "액세서리: 시계",
                "코멘트: 단정한 코디를 추천합니다"
        );

        Optional<AiRecommendationResult> result = parser.parse(text);

        assertThat(result).isPresent();
        assertThat(result.get().top()).isEqualTo("셔츠");
        assertThat(result.get().outer()).isEqualTo("가디건");
        assertThat(result.get().bottom()).isEqualTo("슬랙스");
        assertThat(result.get().shoes()).isEqualTo("로퍼");
        assertThat(result.get().accessory()).isEqualTo("시계");
        assertThat(result.get().comment()).isEqualTo("단정한 코디를 추천합니다");
    }

    @Test
    void parse_shouldFillDefaultWhenSomeKeysMissing() {
        String text = String.join("\n",
                "상의: 반팔 티셔츠",
                "하의: 반바지",
                "코멘트: 더운 날씨입니다"
        );

        Optional<AiRecommendationResult> result = parser.parse(text);

        assertThat(result).isPresent();
        assertThat(result.get().top()).isEqualTo("반팔 티셔츠");
        assertThat(result.get().bottom()).isEqualTo("반바지");
        assertThat(result.get().outer()).isEqualTo("없음");
        assertThat(result.get().shoes()).isEqualTo("없음");
        assertThat(result.get().accessory()).isEqualTo("없음");
        assertThat(result.get().comment()).isEqualTo("더운 날씨입니다");
    }
}