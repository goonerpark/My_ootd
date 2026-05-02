package com.ootd.backend.ootdpost.repository;

import com.ootd.backend.ootdpost.entity.LookCategory;
import com.ootd.backend.ootdpost.entity.OotdPost;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface OotdPostRepository extends JpaRepository<OotdPost, Long> {

    @Query("""
            select p from OotdPost p
            where p.isActive = true
              and (:lookCategory is null or p.lookCategory = :lookCategory)
              and (:hashtag is null or exists (
                    select ph.id from OotdPostHashtag ph
                    where ph.post = p and lower(ph.hashtag.name) = lower(:hashtag)
              ))
            order by p.createdAt desc
            """)
    Page<OotdPost> searchActivePosts(
            @Param("lookCategory") LookCategory lookCategory,
            @Param("hashtag") String hashtag,
            Pageable pageable
    );

    @Query("""
            select p from OotdPost p
            where p.isActive = true
              and p.likeCount >= 5
              and (:lookCategory is null or p.lookCategory = :lookCategory)
            order by p.likeCount desc, p.createdAt desc
            """)
    Page<OotdPost> findInspirations(@Param("lookCategory") LookCategory lookCategory, Pageable pageable);

    Optional<OotdPost> findByIdAndIsActiveTrue(Long id);
}
