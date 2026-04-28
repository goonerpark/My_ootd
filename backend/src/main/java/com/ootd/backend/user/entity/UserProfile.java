package com.ootd.backend.user.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Getter
@Entity
@Table(name = "user_profiles")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class UserProfile extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    @Enumerated(EnumType.STRING)
    @Column(name = "personal_color", nullable = false, length = 20)
    private PersonalColor personalColor;

    @Enumerated(EnumType.STRING)
    @Column(name = "body_type", nullable = false, length = 20)
    private BodyType bodyType;

    @Column(name = "height_cm", precision = 5, scale = 1)
    private BigDecimal heightCm;

    @Column(name = "weight_kg", precision = 5, scale = 1)
    private BigDecimal weightKg;

    @Column(name = "preferred_style", length = 50)
    private String preferredStyle;

    @Column(name = "profile_image_url", length = 500)
    private String profileImageUrl;

    @Builder
    public UserProfile(
            User user,
            PersonalColor personalColor,
            BodyType bodyType,
            BigDecimal heightCm,
            BigDecimal weightKg,
            String preferredStyle,
            String profileImageUrl
    ) {
        this.user = user;
        this.personalColor = personalColor;
        this.bodyType = bodyType;
        this.heightCm = heightCm;
        this.weightKg = weightKg;
        this.preferredStyle = preferredStyle;
        this.profileImageUrl = profileImageUrl;
    }

    public void updateProfile(
            PersonalColor personalColor,
            BodyType bodyType,
            BigDecimal heightCm,
            BigDecimal weightKg,
            String preferredStyle
    ) {
        this.personalColor = personalColor == null ? PersonalColor.UNKNOWN : personalColor;
        this.bodyType = bodyType == null ? BodyType.UNKNOWN : bodyType;
        this.heightCm = heightCm;
        this.weightKg = weightKg;
        this.preferredStyle = preferredStyle == null || preferredStyle.isBlank() ? null : preferredStyle.trim();
    }
}