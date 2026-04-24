package com.ootd.backend.ootdreview.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

public record OotdReviewResponse(
        Long id,
        Long userId,
        LocalDate reviewDate,
        BigDecimal rating,
        String fitFeedback,
        String colorFeedback,
        String overallFeedback,
        String aiModelVersion,
        LocalDateTime createdAt,
        List<String> imageUrls
) {
}
