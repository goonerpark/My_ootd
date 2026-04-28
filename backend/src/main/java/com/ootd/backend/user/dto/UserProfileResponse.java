package com.ootd.backend.user.dto;

import com.ootd.backend.user.entity.BodyType;
import com.ootd.backend.user.entity.Gender;
import com.ootd.backend.user.entity.PersonalColor;
import com.ootd.backend.user.entity.User;
import com.ootd.backend.user.entity.UserProfile;

import java.math.BigDecimal;

public record UserProfileResponse(
        Long userId,
        String email,
        String nickname,
        Gender gender,
        PersonalColor personalColor,
        BodyType bodyType,
        BigDecimal heightCm,
        BigDecimal weightKg,
        String preferredStyle,
        String profileImageUrl
) {
    public static UserProfileResponse of(User user, UserProfile profile) {
        return new UserProfileResponse(
                user.getId(),
                user.getEmail(),
                user.getNickname(),
                user.getGender(),
                profile.getPersonalColor(),
                profile.getBodyType(),
                profile.getHeightCm(),
                profile.getWeightKg(),
                profile.getPreferredStyle(),
                profile.getProfileImageUrl()
        );
    }
}