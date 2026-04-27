package com.ootd.backend.recommendation.repository;

import com.ootd.backend.recommendation.entity.RecommendedClosetItem;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface RecommendedClosetItemRepository extends JpaRepository<RecommendedClosetItem, Long> {

    List<RecommendedClosetItem> findByRecommendationId(Long recommendationId);

    void deleteByRecommendationId(Long recommendationId);
}
