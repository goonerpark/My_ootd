package com.ootd.backend.ootdreview.repository;

import com.ootd.backend.ootdreview.entity.OotdReview;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface OotdReviewRepository extends JpaRepository<OotdReview, Long> {
    List<OotdReview> findByUserIdOrderByReviewDateDescCreatedAtDesc(Long userId);
}
