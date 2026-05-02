package com.ootd.backend.ootdpost.entity;

import com.ootd.backend.user.entity.BaseTimeEntity;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Entity
@Table(
        name = "ootd_post_hashtags",
        uniqueConstraints = @UniqueConstraint(name = "uk_ootd_post_hashtag", columnNames = {"post_id", "hashtag_id"})
)
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class OotdPostHashtag extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "post_id", nullable = false)
    private OotdPost post;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "hashtag_id", nullable = false)
    private OotdHashtag hashtag;

    @Builder
    public OotdPostHashtag(OotdPost post, OotdHashtag hashtag) {
        this.post = post;
        this.hashtag = hashtag;
    }
}
