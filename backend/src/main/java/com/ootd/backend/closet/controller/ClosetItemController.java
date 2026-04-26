package com.ootd.backend.closet.controller;

import com.ootd.backend.closet.dto.ClosetItemResponse;
import com.ootd.backend.closet.dto.CreateClosetItemRequest;
import com.ootd.backend.closet.dto.UpdateClosetItemRequest;
import com.ootd.backend.closet.service.ClosetItemService;
import com.ootd.backend.common.api.ApiResponse;
import com.ootd.backend.security.auth.CustomUserDetails;
import com.ootd.backend.user.exception.AuthenticationFailedException;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/closet-items")
@RequiredArgsConstructor
public class ClosetItemController {

    private final ClosetItemService closetItemService;

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<ClosetItemResponse>> createItem(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @Valid @ModelAttribute CreateClosetItemRequest request
    ) {
        Long userId = extractUserId(userDetails);
        return ResponseEntity.ok(ApiResponse.ok(closetItemService.create(userId, request)));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<ClosetItemResponse>>> getMyItems(
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        Long userId = extractUserId(userDetails);
        return ResponseEntity.ok(ApiResponse.ok(closetItemService.getMyItems(userId)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<ClosetItemResponse>> getMyItem(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable Long id
    ) {
        Long userId = extractUserId(userDetails);
        return ResponseEntity.ok(ApiResponse.ok(closetItemService.getMyItem(userId, id)));
    }

    @PutMapping(value = "/{id}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<ClosetItemResponse>> updateItem(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable Long id,
            @Valid @ModelAttribute UpdateClosetItemRequest request
    ) {
        Long userId = extractUserId(userDetails);
        return ResponseEntity.ok(ApiResponse.ok(closetItemService.update(userId, id, request)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteItem(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable Long id
    ) {
        Long userId = extractUserId(userDetails);
        closetItemService.softDelete(userId, id);
        return ResponseEntity.ok(ApiResponse.ok(null));
    }

    private Long extractUserId(CustomUserDetails userDetails) {
        if (userDetails == null || userDetails.getUserId() == null) {
            throw new AuthenticationFailedException("Authentication is required");
        }
        return userDetails.getUserId();
    }
}
