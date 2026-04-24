package com.ootd.backend.ootdreview.ai.dto;

import java.math.BigDecimal;

public record OotdEvaluationResult(
        BigDecimal rating,
        String fitFeedback,
        String colorFeedback,
        String overallFeedback,
        String aiModelVersion
) {
}
