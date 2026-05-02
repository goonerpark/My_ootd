package com.ootd.backend.ootdpost.repository;

import com.ootd.backend.ootdpost.entity.OotdHashtag;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface OotdHashtagRepository extends JpaRepository<OotdHashtag, Long> {
    Optional<OotdHashtag> findByNameIgnoreCase(String name);
}
