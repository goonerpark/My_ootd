package com.ootd.backend.ootdpost.entity;

import com.ootd.backend.user.entity.BaseTimeEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Entity
@Table(
        name = "ootd_hashtags",
        uniqueConstraints = @UniqueConstraint(name = "uk_ootd_hashtags_name", columnNames = "name")
)
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class OotdHashtag extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 50)
    private String name;

    @Builder
    public OotdHashtag(String name) {
        this.name = name;
    }
}
