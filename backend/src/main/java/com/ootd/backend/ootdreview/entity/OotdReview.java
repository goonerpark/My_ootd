package com.ootd.backend.ootdreview.entity;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

@Getter
@Entity
@Table(name = "ootd_reviews")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class OotdReview {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "review_date", nullable = false)
    private LocalDate reviewDate;

    @Column(name = "rating", nullable = false, precision = 2, scale = 1)
    private BigDecimal rating;

    @Column(name = "fit_feedback", length = 500)
    private String fitFeedback;

    @Column(name = "color_feedback", length = 500)
    private String colorFeedback;

    @Column(name = "overall_feedback", length = 1000)
    private String overallFeedback;

    @Column(name = "ai_model_version", length = 100)
    private String aiModelVersion;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @OneToMany(mappedBy = "ootdReview", fetch = FetchType.LAZY, cascade = CascadeType.ALL, orphanRemoval = true)
    private List<OotdReviewImage> images = new ArrayList<>();

    @Builder
    public OotdReview(Long userId, LocalDate reviewDate, BigDecimal rating, String fitFeedback,
                      String colorFeedback, String overallFeedback, String aiModelVersion) {
        this.userId = userId;
        this.reviewDate = reviewDate;
        this.rating = rating;
        this.fitFeedback = fitFeedback;
        this.colorFeedback = colorFeedback;
        this.overallFeedback = overallFeedback;
        this.aiModelVersion = aiModelVersion;
    }

    public void addImage(String imageUrl) {
        OotdReviewImage image = OotdReviewImage.builder()
                .ootdReview(this)
                .imageUrl(imageUrl)
                .build();
        this.images.add(image);
    }

    public List<OotdReviewImage> getImages() {
        return Collections.unmodifiableList(images);
    }

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
    }
}
