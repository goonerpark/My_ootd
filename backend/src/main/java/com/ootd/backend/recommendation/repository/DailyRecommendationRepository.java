package com.ootd.backend.recommendation.repository;

import com.ootd.backend.recommendation.entity.DailyRecommendation;
import com.ootd.backend.recommendation.entity.RecommendationType;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface DailyRecommendationRepository extends JpaRepository<DailyRecommendation, Long> {

    Optional<DailyRecommendation> findFirstByUserIdAndTargetDateAndRecommendationTypeOrderByCreatedAtDesc(
            Long userId,
            LocalDate targetDate,
            RecommendationType recommendationType
    );

    List<DailyRecommendation> findTop10ByUserIdAndRecommendationTypeOrderByTargetDateDescCreatedAtDesc(
            Long userId,
            RecommendationType recommendationType
    );
}
