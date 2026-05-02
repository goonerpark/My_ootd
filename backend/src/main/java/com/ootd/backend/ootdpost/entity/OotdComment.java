package com.ootd.backend.ootdpost.entity;

import com.ootd.backend.user.entity.BaseTimeEntity;
import com.ootd.backend.user.entity.User;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Entity
@Table(name = "ootd_comments")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class OotdComment extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "post_id", nullable = false)
    private OotdPost post;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User author;

    @Column(nullable = false, length = 500)
    private String content;

    @Builder
    public OotdComment(OotdPost post, User author, String content) {
        this.post = post;
        this.author = author;
        this.content = content;
    }

    public boolean isWrittenBy(Long userId) {
        return author != null && author.getId() != null && author.getId().equals(userId);
    }
}
