package com.ootd.backend.ootdpost.entity;

import com.ootd.backend.user.entity.BaseTimeEntity;
import com.ootd.backend.user.entity.User;
import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

@Getter
@Entity
@Table(name = "ootd_posts")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class OotdPost extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User author;

    @Column(nullable = false, length = 1000)
    private String caption;

    @Enumerated(EnumType.STRING)
    @Column(name = "look_category", nullable = false, length = 30)
    private LookCategory lookCategory;

    @Column(name = "view_count", nullable = false)
    private Long viewCount;

    @Column(name = "like_count", nullable = false)
    private Long likeCount;

    @Column(name = "is_active", nullable = false)
    private Boolean isActive;

    @OneToMany(mappedBy = "post", fetch = FetchType.LAZY, cascade = CascadeType.ALL, orphanRemoval = true)
    private List<OotdPostImage> images = new ArrayList<>();

    @OneToMany(mappedBy = "post", fetch = FetchType.LAZY, cascade = CascadeType.ALL, orphanRemoval = true)
    private List<OotdPostHashtag> postHashtags = new ArrayList<>();

    @OneToMany(mappedBy = "post", fetch = FetchType.LAZY, cascade = CascadeType.ALL, orphanRemoval = true)
    private List<OotdComment> comments = new ArrayList<>();

    @Builder
    public OotdPost(User author, String caption, LookCategory lookCategory) {
        this.author = author;
        this.caption = caption;
        this.lookCategory = lookCategory;
        this.viewCount = 0L;
        this.likeCount = 0L;
        this.isActive = true;
    }

    public OotdPostImage addImage(String imageUrl, int imageOrder) {
        OotdPostImage image = OotdPostImage.builder()
                .post(this)
                .imageUrl(imageUrl)
                .imageOrder(imageOrder)
                .build();
        this.images.add(image);
        return image;
    }

    public void addHashtag(OotdHashtag hashtag) {
        OotdPostHashtag postHashtag = OotdPostHashtag.builder()
                .post(this)
                .hashtag(hashtag)
                .build();
        this.postHashtags.add(postHashtag);
    }

    public void increaseViewCount() {
        this.viewCount += 1;
    }

    public void increaseLikeCount() {
        this.likeCount += 1;
    }

    public void decreaseLikeCount() {
        if (this.likeCount > 0) {
            this.likeCount -= 1;
        }
    }

    public List<OotdPostImage> getImages() {
        return Collections.unmodifiableList(images);
    }

    public List<OotdPostHashtag> getPostHashtags() {
        return Collections.unmodifiableList(postHashtags);
    }

    public List<OotdComment> getComments() {
        return Collections.unmodifiableList(comments);
    }
}
