package com.ootd.backend.ootdpost.entity;

import com.ootd.backend.user.entity.BaseTimeEntity;
import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

@Getter
@Entity
@Table(name = "ootd_post_images")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class OotdPostImage extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "post_id", nullable = false)
    private OotdPost post;

    @Column(name = "image_url", nullable = false, length = 500)
    private String imageUrl;

    @Column(name = "image_order", nullable = false)
    private Integer imageOrder;

    @OneToMany(mappedBy = "image", fetch = FetchType.LAZY, cascade = CascadeType.ALL, orphanRemoval = true)
    private List<OotdImageBrandTag> brandTags = new ArrayList<>();

    @Builder
    public OotdPostImage(OotdPost post, String imageUrl, Integer imageOrder) {
        this.post = post;
        this.imageUrl = imageUrl;
        this.imageOrder = imageOrder;
    }

    public void addBrandTag(String brandName, String shopUrl, Double positionX, Double positionY) {
        OotdImageBrandTag brandTag = OotdImageBrandTag.builder()
                .image(this)
                .brandName(brandName)
                .shopUrl(shopUrl)
                .positionX(positionX)
                .positionY(positionY)
                .build();
        this.brandTags.add(brandTag);
    }

    public List<OotdImageBrandTag> getBrandTags() {
        return Collections.unmodifiableList(brandTags);
    }
}
