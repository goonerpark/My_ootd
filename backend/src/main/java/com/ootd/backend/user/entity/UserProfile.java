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

    @Column(name = "preferred_style", length = 50)
    private String preferredStyle;

    @Column(name = "profile_image_url", length = 500)
    private String profileImageUrl;

    @Builder
    public UserProfile(User user, PersonalColor personalColor, BodyType bodyType, String preferredStyle, String profileImageUrl) {
        this.user = user;
        this.personalColor = personalColor;
        this.bodyType = bodyType;
        this.preferredStyle = preferredStyle;
        this.profileImageUrl = profileImageUrl;
    }
}
