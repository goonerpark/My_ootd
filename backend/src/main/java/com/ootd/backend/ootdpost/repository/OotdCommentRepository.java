package com.ootd.backend.ootdpost.repository;

import com.ootd.backend.ootdpost.entity.OotdComment;
import org.springframework.data.jpa.repository.JpaRepository;

public interface OotdCommentRepository extends JpaRepository<OotdComment, Long> {
}
