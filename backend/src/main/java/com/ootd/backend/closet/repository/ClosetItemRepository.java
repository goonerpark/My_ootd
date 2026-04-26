package com.ootd.backend.closet.repository;

import com.ootd.backend.closet.entity.ClosetCategory;
import com.ootd.backend.closet.entity.ClosetFit;
import com.ootd.backend.closet.entity.ClosetItem;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ClosetItemRepository extends JpaRepository<ClosetItem, Long> {

    List<ClosetItem> findByUserIdAndIsActiveTrueOrderByCreatedAtDesc(Long userId);

    Optional<ClosetItem> findByIdAndIsActiveTrue(Long id);

    List<ClosetItem> findByUserIdAndIsActiveTrueAndCategory(Long userId, ClosetCategory category);

    List<ClosetItem> findByUserIdAndIsActiveTrueAndCategoryAndFit(Long userId, ClosetCategory category, ClosetFit fit);

    List<ClosetItem> findByUserIdAndIsActiveTrueAndCategoryAndColorIgnoreCase(Long userId, ClosetCategory category, String color);
}
