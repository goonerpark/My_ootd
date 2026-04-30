package com.ootd.backend.recommendation.controller;

import com.ootd.backend.common.api.ApiResponse;
import com.ootd.backend.recommendation.dto.RecommendationHistoryResponse;
import com.ootd.backend.recommendation.dto.TodayRecommendationResponse;
import com.ootd.backend.recommendation.dto.TodayClosetRecommendationResponse;
import com.ootd.backend.recommendation.dto.WeeklyRecommendationResponse;
import com.ootd.backend.recommendation.service.MemberClosetRecommendationService;
import com.ootd.backend.recommendation.service.RecommendationService;
import com.ootd.backend.recommendation.service.WeeklyRecommendationService;
import com.ootd.backend.security.auth.CustomUserDetails;
import com.ootd.backend.user.entity.Gender;
import com.ootd.backend.user.exception.AuthenticationFailedException;
import jakarta.validation.constraints.NotNull;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@Validated
@RestController
@RequestMapping("/api/recommendations")
@RequiredArgsConstructor
public class RecommendationController {

    private final RecommendationService recommendationService;
    private final WeeklyRecommendationService weeklyRecommendationService;
    private final MemberClosetRecommendationService memberClosetRecommendationService;

    @GetMapping("/today")
    public ResponseEntity<ApiResponse<TodayRecommendationResponse>> getTodayRecommendation(
            @RequestParam @NotNull Gender gender,
            @RequestParam(required = false) Long userId
    ) {
        return ResponseEntity.ok(ApiResponse.ok(recommendationService.getTodayRecommendation(gender, userId)));
    }

    @GetMapping("/member/today")
    public ResponseEntity<ApiResponse<TodayRecommendationResponse>> getTodayMemberRecommendation(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @RequestParam(required = false) Gender gender
    ) {
        if (userDetails == null || userDetails.getUserId() == null) {
            throw new AuthenticationFailedException("Authentication is required");
        }
        return ResponseEntity.ok(ApiResponse.ok(recommendationService.getTodayMemberRecommendation(userDetails.getUserId(), gender)));
    }

    @GetMapping("/weekly")
    public ResponseEntity<ApiResponse<List<WeeklyRecommendationResponse>>> getWeeklyRecommendation(
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        if (userDetails == null || userDetails.getUserId() == null) {
            throw new AuthenticationFailedException("Authentication is required");
        }
        return ResponseEntity.ok(ApiResponse.ok(weeklyRecommendationService.getWeeklyRecommendations(userDetails.getUserId())));
    }

    @GetMapping("/history")
    public ResponseEntity<ApiResponse<List<RecommendationHistoryResponse>>> getRecommendationHistory(
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        if (userDetails == null || userDetails.getUserId() == null) {
            throw new AuthenticationFailedException("Authentication is required");
        }
        return ResponseEntity.ok(ApiResponse.ok(recommendationService.getRecommendationHistory(userDetails.getUserId())));
    }

    @GetMapping("/today/closet")
    public ResponseEntity<ApiResponse<TodayClosetRecommendationResponse>> getTodayClosetRecommendation(
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        if (userDetails == null || userDetails.getUserId() == null) {
            throw new AuthenticationFailedException("Authentication is required");
        }
        return ResponseEntity.ok(ApiResponse.ok(memberClosetRecommendationService.getTodayClosetRecommendation(userDetails.getUserId())));
    }
}
