package com.ootd.backend.recommendation.repository;

import com.ootd.backend.recommendation.entity.DailyRecommendation;
import org.springframework.data.jpa.repository.JpaRepository;

public interface DailyRecommendationRepository extends JpaRepository<DailyRecommendation, Long> {
}
