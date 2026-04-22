package com.ootd.backend.survey.controller;

import com.ootd.backend.common.api.ApiResponse;
import com.ootd.backend.security.auth.CustomUserDetails;
import com.ootd.backend.survey.dto.TodaySurveyResponse;
import com.ootd.backend.survey.dto.UpsertSurveyRequest;
import com.ootd.backend.survey.service.SurveyService;
import com.ootd.backend.user.exception.AuthenticationFailedException;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/surveys")
@RequiredArgsConstructor
public class SurveyController {

    private final SurveyService surveyService;

    @PostMapping
    public ResponseEntity<ApiResponse<TodaySurveyResponse>> upsertTodaySurvey(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @Valid @RequestBody UpsertSurveyRequest request
    ) {
        Long userId = extractUserId(userDetails);
        return ResponseEntity.ok(ApiResponse.ok(surveyService.upsertTodaySurvey(userId, request)));
    }

    @GetMapping("/today")
    public ResponseEntity<ApiResponse<TodaySurveyResponse>> getTodaySurvey(
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        Long userId = extractUserId(userDetails);
        return ResponseEntity.ok(ApiResponse.ok(surveyService.getTodaySurvey(userId)));
    }

    private Long extractUserId(CustomUserDetails userDetails) {
        if (userDetails == null || userDetails.getUserId() == null) {
            throw new AuthenticationFailedException("Authentication is required");
        }
        return userDetails.getUserId();
    }
}
