package com.ootd.backend.ootdpost.repository;

import com.ootd.backend.ootdpost.entity.OotdComment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface OotdCommentRepository extends JpaRepository<OotdComment, Long> {
    Optional<OotdComment> findByIdAndPostId(Long id, Long postId);
}
