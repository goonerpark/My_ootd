package com.ootd.backend.ootdreview.controller;

import com.ootd.backend.common.api.ApiResponse;
import com.ootd.backend.ootdreview.dto.CreateOotdReviewRequest;
import com.ootd.backend.ootdreview.dto.OotdClosetSuggestionsResponse;
import com.ootd.backend.ootdreview.dto.OotdReviewResponse;
import com.ootd.backend.ootdreview.service.OotdClosetSuggestionService;
import com.ootd.backend.ootdreview.service.OotdReviewService;
import com.ootd.backend.security.auth.CustomUserDetails;
import com.ootd.backend.user.exception.AuthenticationFailedException;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/ootd-reviews")
@RequiredArgsConstructor
public class OotdReviewController {

    private final OotdReviewService ootdReviewService;
    private final OotdClosetSuggestionService ootdClosetSuggestionService;

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<OotdReviewResponse>> createReview(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @Valid @ModelAttribute CreateOotdReviewRequest request
    ) {
        Long userId = extractUserId(userDetails);
        return ResponseEntity.ok(ApiResponse.ok(ootdReviewService.createReview(userId, request)));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<OotdReviewResponse>>> getMyReviews(
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        Long userId = extractUserId(userDetails);
        return ResponseEntity.ok(ApiResponse.ok(ootdReviewService.getMyReviews(userId)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<OotdReviewResponse>> getMyReview(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable Long id
    ) {
        Long userId = extractUserId(userDetails);
        return ResponseEntity.ok(ApiResponse.ok(ootdReviewService.getMyReview(userId, id)));
    }

    @GetMapping("/{id}/closet-suggestions")
    public ResponseEntity<ApiResponse<OotdClosetSuggestionsResponse>> getClosetSuggestions(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable Long id
    ) {
        Long userId = extractUserId(userDetails);
        return ResponseEntity.ok(ApiResponse.ok(ootdClosetSuggestionService.suggestFromReview(userId, id)));
    }

    private Long extractUserId(CustomUserDetails userDetails) {
        if (userDetails == null || userDetails.getUserId() == null) {
            throw new AuthenticationFailedException("Authentication is required");
        }
        return userDetails.getUserId();
    }
}
