package com.ootd.backend.ootdpost.controller;

import com.ootd.backend.common.api.ApiResponse;
import com.ootd.backend.ootdpost.dto.CreateOotdCommentRequest;
import com.ootd.backend.ootdpost.dto.CreateOotdPostRequest;
import com.ootd.backend.ootdpost.dto.LikeToggleResponse;
import com.ootd.backend.ootdpost.dto.OotdCommentResponse;
import com.ootd.backend.ootdpost.dto.OotdPostDetailResponse;
import com.ootd.backend.ootdpost.dto.OotdPostSummaryResponse;
import com.ootd.backend.ootdpost.dto.UpdateOotdPostRequest;
import com.ootd.backend.ootdpost.entity.LookCategory;
import com.ootd.backend.ootdpost.service.OotdPostService;
import com.ootd.backend.security.auth.CustomUserDetails;
import com.ootd.backend.user.exception.AuthenticationFailedException;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/ootd-posts")
@RequiredArgsConstructor
public class OotdPostController {

    private final OotdPostService ootdPostService;

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<OotdPostDetailResponse>> createPost(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @Valid @ModelAttribute CreateOotdPostRequest request
    ) {
        Long userId = extractUserId(userDetails);
        return ResponseEntity.ok(ApiResponse.ok(ootdPostService.createPost(userId, request)));
    }

    @PutMapping(value = "/{id}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<OotdPostDetailResponse>> updatePost(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable Long id,
            @Valid @ModelAttribute UpdateOotdPostRequest request
    ) {
        Long userId = extractUserId(userDetails);
        return ResponseEntity.ok(ApiResponse.ok(ootdPostService.updatePost(userId, id, request)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deletePost(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable Long id
    ) {
        Long userId = extractUserId(userDetails);
        ootdPostService.deletePost(userId, id);
        return ResponseEntity.ok(ApiResponse.ok(null));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<Page<OotdPostSummaryResponse>>> getPosts(
            @PageableDefault(size = 20) Pageable pageable,
            @RequestParam(required = false) LookCategory lookCategory,
            @RequestParam(required = false) String hashtag
    ) {
        return ResponseEntity.ok(ApiResponse.ok(ootdPostService.getPosts(pageable, lookCategory, hashtag)));
    }

    @GetMapping("/hashtags/{hashtagName}")
    public ResponseEntity<ApiResponse<Page<OotdPostSummaryResponse>>> getPostsByHashtag(
            @PathVariable String hashtagName,
            @PageableDefault(size = 20) Pageable pageable
    ) {
        return ResponseEntity.ok(ApiResponse.ok(ootdPostService.getPostsByHashtag(hashtagName, pageable)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<OotdPostDetailResponse>> getPostDetail(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable Long id
    ) {
        Long userId = userDetails == null ? null : userDetails.getUserId();
        return ResponseEntity.ok(ApiResponse.ok(ootdPostService.getPostDetail(id, userId)));
    }

    @PostMapping("/{id}/likes")
    public ResponseEntity<ApiResponse<LikeToggleResponse>> toggleLike(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable Long id
    ) {
        Long userId = extractUserId(userDetails);
        return ResponseEntity.ok(ApiResponse.ok(ootdPostService.toggleLike(userId, id)));
    }

    @PostMapping("/{id}/comments")
    public ResponseEntity<ApiResponse<OotdCommentResponse>> createComment(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable Long id,
            @Valid @RequestBody CreateOotdCommentRequest request
    ) {
        Long userId = extractUserId(userDetails);
        return ResponseEntity.ok(ApiResponse.ok(ootdPostService.createComment(userId, id, request)));
    }

    private Long extractUserId(CustomUserDetails userDetails) {
        if (userDetails == null || userDetails.getUserId() == null) {
            throw new AuthenticationFailedException("Authentication is required");
        }
        return userDetails.getUserId();
    }
}
