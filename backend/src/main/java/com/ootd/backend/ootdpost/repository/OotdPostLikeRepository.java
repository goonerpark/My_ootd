package com.ootd.backend.ootdpost.repository;

import com.ootd.backend.ootdpost.entity.OotdPostLike;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface OotdPostLikeRepository extends JpaRepository<OotdPostLike, Long> {
    Optional<OotdPostLike> findByPostIdAndUserId(Long postId, Long userId);
}
