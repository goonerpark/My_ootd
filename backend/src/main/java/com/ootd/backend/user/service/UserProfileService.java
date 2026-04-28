package com.ootd.backend.user.service;

import com.ootd.backend.user.dto.UpdateUserProfileRequest;
import com.ootd.backend.user.dto.UserProfileResponse;
import com.ootd.backend.user.entity.BodyType;
import com.ootd.backend.user.entity.PersonalColor;
import com.ootd.backend.user.entity.User;
import com.ootd.backend.user.entity.UserProfile;
import com.ootd.backend.user.repository.UserProfileRepository;
import com.ootd.backend.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Objects;

@Service
@RequiredArgsConstructor
public class UserProfileService {

    private final UserRepository userRepository;
    private final UserProfileRepository userProfileRepository;

    @Transactional
    public UserProfileResponse getMyProfile(Long userId) {
        User user = findUser(userId);
        UserProfile profile = findOrCreateProfile(user);
        return UserProfileResponse.of(user, profile);
    }

    @Transactional
    public UserProfileResponse updateMyProfile(Long userId, UpdateUserProfileRequest request) {
        User user = findUser(userId);
        UserProfile profile = findOrCreateProfile(user);
        profile.updateProfile(
                request.personalColor() == null ? PersonalColor.UNKNOWN : request.personalColor(),
                request.bodyType() == null ? BodyType.UNKNOWN : request.bodyType(),
                request.heightCm(),
                request.weightKg(),
                request.preferredStyle()
        );
        return UserProfileResponse.of(user, profile);
    }

    private User findUser(Long userId) {
        return userRepository.findById(Objects.requireNonNull(userId))
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
    }

    private UserProfile findOrCreateProfile(User user) {
        return userProfileRepository.findByUserId(user.getId())
                .orElseGet(() -> {
                    UserProfile profile = UserProfile.builder()
                        .user(user)
                        .personalColor(PersonalColor.UNKNOWN)
                        .bodyType(BodyType.UNKNOWN)
                        .heightCm(null)
                        .weightKg(null)
                        .preferredStyle(null)
                        .profileImageUrl(null)
                        .build();
                    return userProfileRepository.save(Objects.requireNonNull(profile));
                });
    }
}
