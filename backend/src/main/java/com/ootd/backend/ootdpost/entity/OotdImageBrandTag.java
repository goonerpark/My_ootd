package com.ootd.backend.ootdpost.entity;

import com.ootd.backend.user.entity.BaseTimeEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Entity
@Table(name = "ootd_image_brand_tags")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class OotdImageBrandTag extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "image_id", nullable = false)
    private OotdPostImage image;

    @Column(name = "brand_name", nullable = false, length = 100)
    private String brandName;

    @Column(name = "shop_url", length = 500)
    private String shopUrl;

    @Column(name = "position_x", nullable = false)
    private Double positionX;

    @Column(name = "position_y", nullable = false)
    private Double positionY;

    @Builder
    public OotdImageBrandTag(OotdPostImage image, String brandName, String shopUrl, Double positionX, Double positionY) {
        this.image = image;
        this.brandName = brandName;
        this.shopUrl = shopUrl;
        this.positionX = positionX;
        this.positionY = positionY;
    }
}
