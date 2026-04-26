package com.ootd.backend.closet.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Getter
@Entity
@Table(name = "closet_items")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class ClosetItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Enumerated(EnumType.STRING)
    @Column(name = "category", nullable = false, length = 20)
    private ClosetCategory category;

    @Column(name = "subcategory", length = 50)
    private String subcategory;

    @Column(name = "color", length = 50)
    private String color;

    @Enumerated(EnumType.STRING)
    @Column(name = "season", nullable = false, length = 20)
    private ClosetSeason season;

    @Enumerated(EnumType.STRING)
    @Column(name = "thickness", nullable = false, length = 20)
    private ClosetThickness thickness;

    @Enumerated(EnumType.STRING)
    @Column(name = "fit", nullable = false, length = 20)
    private ClosetFit fit;

    @Column(name = "brand", length = 100)
    private String brand;

    @Column(name = "image_url", nullable = false, length = 500)
    private String imageUrl;

    @Column(name = "memo", length = 255)
    private String memo;

    @Column(name = "is_active", nullable = false)
    private Boolean isActive;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @Builder
    public ClosetItem(Long userId, ClosetCategory category, String subcategory, String color,
                      ClosetSeason season, ClosetThickness thickness, ClosetFit fit, String brand,
                      String imageUrl, String memo) {
        this.userId = userId;
        this.category = category;
        this.subcategory = subcategory;
        this.color = color;
        this.season = season;
        this.thickness = thickness;
        this.fit = fit;
        this.brand = brand;
        this.imageUrl = imageUrl;
        this.memo = memo;
    }

    public void update(ClosetCategory category, String subcategory, String color,
                       ClosetSeason season, ClosetThickness thickness, ClosetFit fit,
                       String brand, String imageUrl, String memo) {
        this.category = category;
        this.subcategory = subcategory;
        this.color = color;
        this.season = season;
        this.thickness = thickness;
        this.fit = fit;
        this.brand = brand;
        this.imageUrl = imageUrl;
        this.memo = memo;
    }

    public void softDelete() {
        this.isActive = false;
    }

    @PrePersist
    protected void onCreate() {
        LocalDateTime now = LocalDateTime.now();
        this.createdAt = now;
        this.updatedAt = now;
        if (this.season == null) {
            this.season = ClosetSeason.ALL;
        }
        if (this.thickness == null) {
            this.thickness = ClosetThickness.NORMAL;
        }
        if (this.fit == null) {
            this.fit = ClosetFit.UNKNOWN;
        }
        if (this.isActive == null) {
            this.isActive = true;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}
