package com.ootd.backend.ootdpost.controller;

import com.ootd.backend.common.api.ApiResponse;
import com.ootd.backend.ootdpost.service.OotdPostService;
import com.ootd.backend.security.auth.CustomUserDetails;
import com.ootd.backend.user.exception.AuthenticationFailedException;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/ootd-comments")
@RequiredArgsConstructor
public class OotdCommentController {

    private final OotdPostService ootdPostService;

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteComment(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable Long id
    ) {
        Long userId = extractUserId(userDetails);
        ootdPostService.deleteComment(userId, id);
        return ResponseEntity.ok(ApiResponse.ok(null));
    }

    private Long extractUserId(CustomUserDetails userDetails) {
        if (userDetails == null || userDetails.getUserId() == null) {
            throw new AuthenticationFailedException("Authentication is required");
        }
        return userDetails.getUserId();
    }
}
