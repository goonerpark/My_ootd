package com.ootd.backend.user.controller;

import com.ootd.backend.common.api.ApiResponse;
import com.ootd.backend.security.auth.CustomUserDetails;
import com.ootd.backend.user.dto.UpdateUserProfileRequest;
import com.ootd.backend.user.dto.UserProfileResponse;
import com.ootd.backend.user.service.UserProfileService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/users/me/profile")
@RequiredArgsConstructor
public class UserProfileController {

    private final UserProfileService userProfileService;

    @GetMapping
    public ResponseEntity<ApiResponse<UserProfileResponse>> getMyProfile(@AuthenticationPrincipal CustomUserDetails userDetails) {
        return ResponseEntity.ok(ApiResponse.ok(userProfileService.getMyProfile(userDetails.getUserId())));
    }

    @PutMapping
    public ResponseEntity<ApiResponse<UserProfileResponse>> updateMyProfile(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @Valid @RequestBody UpdateUserProfileRequest request
    ) {
        return ResponseEntity.ok(ApiResponse.ok(userProfileService.updateMyProfile(userDetails.getUserId(), request)));
    }
}