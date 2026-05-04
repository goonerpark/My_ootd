package com.ootd.backend.ootdpost.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.ootd.backend.ootdpost.dto.BrandTagInput;
import com.ootd.backend.ootdpost.dto.CreateOotdCommentRequest;
import com.ootd.backend.ootdpost.dto.CreateOotdPostRequest;
import com.ootd.backend.ootdpost.dto.LikeToggleResponse;
import com.ootd.backend.ootdpost.dto.OotdBrandTagResponse;
import com.ootd.backend.ootdpost.dto.OotdCommentResponse;
import com.ootd.backend.ootdpost.dto.OotdPostDetailResponse;
import com.ootd.backend.ootdpost.dto.OotdPostImageResponse;
import com.ootd.backend.ootdpost.dto.OotdPostSummaryResponse;
import com.ootd.backend.ootdpost.dto.UpdateOotdPostRequest;
import com.ootd.backend.ootdpost.entity.LookCategory;
import com.ootd.backend.ootdpost.entity.OotdComment;
import com.ootd.backend.ootdpost.entity.OotdHashtag;
import com.ootd.backend.ootdpost.entity.OotdImageBrandTag;
import com.ootd.backend.ootdpost.entity.OotdPost;
import com.ootd.backend.ootdpost.entity.OotdPostHashtag;
import com.ootd.backend.ootdpost.entity.OotdPostImage;
import com.ootd.backend.ootdpost.entity.OotdPostLike;
import com.ootd.backend.ootdpost.exception.OotdCommentNotFoundException;
import com.ootd.backend.ootdpost.exception.OotdPostAccessDeniedException;
import com.ootd.backend.ootdpost.exception.OotdPostNotFoundException;
import com.ootd.backend.ootdpost.repository.OotdCommentRepository;
import com.ootd.backend.ootdpost.repository.OotdHashtagRepository;
import com.ootd.backend.ootdpost.repository.OotdPostLikeRepository;
import com.ootd.backend.ootdpost.repository.OotdPostRepository;
import com.ootd.backend.ootdreview.storage.OotdImageStorageClient;
import com.ootd.backend.user.entity.User;
import com.ootd.backend.user.entity.UserProfile;
import com.ootd.backend.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class OotdPostService {

    private static final TypeReference<List<BrandTagInput>> BRAND_TAG_INPUT_LIST = new TypeReference<>() {
    };
    private static final TypeReference<List<String>> STRING_LIST = new TypeReference<>() {
    };

    private final OotdPostRepository ootdPostRepository;
    private final OotdHashtagRepository hashtagRepository;
    private final OotdPostLikeRepository likeRepository;
    private final OotdCommentRepository commentRepository;
    private final UserRepository userRepository;
    private final OotdImageStorageClient imageStorageClient;
    private final ObjectMapper objectMapper;

    @Transactional
    public OotdPostDetailResponse createPost(Long userId, CreateOotdPostRequest request) {
        User author = getUser(userId);
        List<MultipartFile> images = validateImages(request.getImages());

        OotdPost post = OotdPost.builder()
                .author(author)
                .caption(request.getCaption().trim())
                .lookCategory(request.getLookCategory())
                .build();

        for (int i = 0; i < images.size(); i++) {
            String imageUrl = imageStorageClient.store(images.get(i));
            post.addImage(imageUrl, i);
        }

        attachBrandTags(post, parseBrandTags(request.getBrandTagsJson()));
        attachHashtags(post, parseHashtags(request.getHashtags()));

        OotdPost saved = ootdPostRepository.save(post);
        return toDetailResponse(saved);
    }

    @Transactional
    public OotdPostDetailResponse updatePost(Long userId, Long postId, UpdateOotdPostRequest request) {
        OotdPost post = getActivePost(postId);
        assertPostAuthor(post, userId);

        post.update(request.getCaption().trim(), request.getLookCategory());
        post.clearHashtags();
        ootdPostRepository.flush();
        attachHashtags(post, parseHashtags(request.getHashtags()));

        if (hasReplacementImages(request.getImages())) {
            List<MultipartFile> images = validateImages(request.getImages());
            post.clearImages();
            ootdPostRepository.flush();
            for (int i = 0; i < images.size(); i++) {
                String imageUrl = imageStorageClient.store(images.get(i));
                post.addImage(imageUrl, i);
            }
            attachBrandTags(post, parseBrandTags(request.getBrandTagsJson()));
        } else if (StringUtils.hasText(request.getBrandTagsJson())) {
            post.getImages().forEach(OotdPostImage::clearBrandTags);
            ootdPostRepository.flush();
            attachBrandTags(post, parseBrandTags(request.getBrandTagsJson()));
        }

        return toDetailResponse(post);
    }

    @Transactional
    public void deletePost(Long userId, Long postId) {
        OotdPost post = getActivePost(postId);
        assertPostAuthor(post, userId);
        post.deactivate();
    }

    @Transactional(readOnly = true)
    public Page<OotdPostSummaryResponse> getPosts(Pageable pageable, LookCategory lookCategory, String hashtag) {
        String normalizedHashtag = normalizeNullableHashtag(hashtag);
        return ootdPostRepository.searchActivePosts(lookCategory, normalizedHashtag, pageable)
                .map(this::toSummaryResponse);
    }

    @Transactional
    public OotdPostDetailResponse getPostDetail(Long id) {
        return getPostDetail(id, null);
    }

    @Transactional
    public OotdPostDetailResponse getPostDetail(Long id, Long viewerUserId) {
        OotdPost post = getActivePost(id);
        post.increaseViewCount();
        return toDetailResponse(post, viewerUserId);
    }

    @Transactional
    public LikeToggleResponse toggleLike(Long userId, Long postId) {
        User user = getUser(userId);
        OotdPost post = getActivePost(postId);

        return likeRepository.findByPostIdAndUserId(postId, userId)
                .map(existing -> {
                    likeRepository.delete(existing);
                    post.decreaseLikeCount();
                    return new LikeToggleResponse(post.getId(), false, post.getLikeCount());
                })
                .orElseGet(() -> {
                    OotdPostLike like = OotdPostLike.builder()
                            .post(post)
                            .user(user)
                            .build();
                    likeRepository.save(like);
                    post.increaseLikeCount();
                    return new LikeToggleResponse(post.getId(), true, post.getLikeCount());
                });
    }

    @Transactional
    public OotdCommentResponse createComment(Long userId, Long postId, CreateOotdCommentRequest request) {
        User author = getUser(userId);
        OotdPost post = getActivePost(postId);
        OotdComment comment = OotdComment.builder()
                .post(post)
                .author(author)
                .content(request.content().trim())
                .build();
        return toCommentResponse(commentRepository.save(comment));
    }

    @Transactional
    public void deleteComment(Long userId, Long commentId) {
        OotdComment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new OotdCommentNotFoundException(commentId));
        if (!comment.isWrittenBy(userId)) {
            throw new OotdPostAccessDeniedException("Only the comment author can delete this comment");
        }
        commentRepository.delete(comment);
    }

    @Transactional(readOnly = true)
    public Page<OotdPostSummaryResponse> getPostsByHashtag(String hashtagName, Pageable pageable) {
        String normalized = normalizeRequiredHashtag(hashtagName);
        return ootdPostRepository.searchActivePosts(null, normalized, pageable)
                .map(this::toSummaryResponse);
    }

    @Transactional(readOnly = true)
    public Page<OotdPostSummaryResponse> getInspirations(Pageable pageable, LookCategory lookCategory) {
        return ootdPostRepository.findInspirations(lookCategory, pageable)
                .map(this::toSummaryResponse);
    }

    private User getUser(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + userId));
    }

    private OotdPost getActivePost(Long postId) {
        return ootdPostRepository.findByIdAndIsActiveTrue(postId)
                .orElseThrow(() -> new OotdPostNotFoundException(postId));
    }

    private void assertPostAuthor(OotdPost post, Long userId) {
        if (post.getAuthor() == null || post.getAuthor().getId() == null || !post.getAuthor().getId().equals(userId)) {
            throw new OotdPostAccessDeniedException("Only the post author can modify this post");
        }
    }

    private boolean hasReplacementImages(List<MultipartFile> images) {
        return images != null && images.stream().anyMatch(image -> image != null && !image.isEmpty());
    }

    private List<MultipartFile> validateImages(List<MultipartFile> images) {
        if (images == null || images.isEmpty()) {
            throw new IllegalArgumentException("At least one image is required");
        }
        for (MultipartFile image : images) {
            if (image == null || image.isEmpty()) {
                throw new IllegalArgumentException("All uploaded images must be non-empty");
            }
        }
        return images;
    }

    private void attachBrandTags(OotdPost post, List<BrandTagInput> brandTags) {
        if (brandTags.isEmpty()) {
            return;
        }
        Map<Integer, OotdPostImage> imagesByIndex = post.getImages().stream()
                .collect(Collectors.toMap(OotdPostImage::getImageOrder, Function.identity()));

        for (BrandTagInput tag : brandTags) {
            validateBrandTag(tag, imagesByIndex);
            imagesByIndex.get(tag.imageIndex()).addBrandTag(
                    tag.brandName().trim(),
                    normalizeBlankToNull(tag.shopUrl()),
                    tag.positionX(),
                    tag.positionY()
            );
        }
    }

    private void validateBrandTag(BrandTagInput tag, Map<Integer, OotdPostImage> imagesByIndex) {
        if (tag == null) {
            throw new IllegalArgumentException("brandTagsJson contains null item");
        }
        if (tag.imageIndex() == null || !imagesByIndex.containsKey(tag.imageIndex())) {
            throw new IllegalArgumentException("brand tag imageIndex is invalid: " + tag.imageIndex());
        }
        if (!StringUtils.hasText(tag.brandName())) {
            throw new IllegalArgumentException("brandName is required");
        }
        if (tag.positionX() == null || tag.positionY() == null
                || tag.positionX() < 0 || tag.positionX() > 100
                || tag.positionY() < 0 || tag.positionY() > 100) {
            throw new IllegalArgumentException("brand tag position must be between 0 and 100");
        }
    }

    private List<BrandTagInput> parseBrandTags(String brandTagsJson) {
        if (!StringUtils.hasText(brandTagsJson)) {
            return List.of();
        }
        try {
            return objectMapper.readValue(brandTagsJson, BRAND_TAG_INPUT_LIST);
        } catch (JsonProcessingException ex) {
            throw new IllegalArgumentException("brandTagsJson must be a JSON array");
        }
    }

    private void attachHashtags(OotdPost post, List<String> hashtags) {
        for (String hashtagName : hashtags) {
            OotdHashtag hashtag = hashtagRepository.findByNameIgnoreCase(hashtagName)
                    .orElseGet(() -> hashtagRepository.save(OotdHashtag.builder().name(hashtagName).build()));
            post.addHashtag(hashtag);
        }
    }

    private List<String> parseHashtags(List<String> rawHashtags) {
        if (rawHashtags == null || rawHashtags.isEmpty()) {
            return List.of();
        }
        Set<String> normalized = new LinkedHashSet<>();
        for (String raw : rawHashtags) {
            if (!StringUtils.hasText(raw)) {
                continue;
            }
            if (raw.trim().startsWith("[")) {
                normalized.addAll(parseHashtagJsonArray(raw));
            } else {
                for (String token : raw.split(",")) {
                    addNormalizedHashtag(normalized, token);
                }
            }
        }
        return new ArrayList<>(normalized);
    }

    private List<String> parseHashtagJsonArray(String raw) {
        try {
            return objectMapper.readValue(raw, STRING_LIST).stream()
                    .map(this::normalizeNullableHashtag)
                    .filter(StringUtils::hasText)
                    .distinct()
                    .toList();
        } catch (JsonProcessingException ex) {
            throw new IllegalArgumentException("hashtags JSON must be an array of strings");
        }
    }

    private void addNormalizedHashtag(Set<String> target, String raw) {
        String normalized = normalizeNullableHashtag(raw);
        if (StringUtils.hasText(normalized)) {
            target.add(normalized);
        }
    }

    private String normalizeRequiredHashtag(String hashtag) {
        String normalized = normalizeNullableHashtag(hashtag);
        if (!StringUtils.hasText(normalized)) {
            throw new IllegalArgumentException("hashtagName is required");
        }
        return normalized;
    }

    private String normalizeNullableHashtag(String hashtag) {
        if (!StringUtils.hasText(hashtag)) {
            return null;
        }
        String normalized = hashtag.trim();
        while (normalized.startsWith("#")) {
            normalized = normalized.substring(1).trim();
        }
        return normalized.toLowerCase();
    }

    private String normalizeBlankToNull(String value) {
        return StringUtils.hasText(value) ? value.trim() : null;
    }

    private OotdPostSummaryResponse toSummaryResponse(OotdPost post) {
        List<OotdPostImage> sortedImages = sortedImages(post);
        String thumbnailUrl = sortedImages.isEmpty() ? null : sortedImages.get(0).getImageUrl();
        UserProfile profile = post.getAuthor().getProfile();
        return new OotdPostSummaryResponse(
                post.getId(),
                thumbnailUrl,
                sortedImages.size() > 1,
                post.getLikeCount(),
                post.getViewCount(),
                post.getCreatedAt(),
                post.getAuthor().getNickname(),
                profile == null ? null : profile.getProfileImageUrl(),
                post.getLookCategory()
        );
    }

    private OotdPostDetailResponse toDetailResponse(OotdPost post) {
        return toDetailResponse(post, null);
    }

    private OotdPostDetailResponse toDetailResponse(OotdPost post, Long viewerUserId) {
        User author = post.getAuthor();
        UserProfile profile = author.getProfile();
        boolean likedByMe = viewerUserId != null && likeRepository.existsByPostIdAndUserId(post.getId(), viewerUserId);
        return new OotdPostDetailResponse(
                post.getId(),
                post.getCaption(),
                post.getLookCategory(),
                sortedImages(post).stream().map(this::toImageResponse).toList(),
                post.getPostHashtags().stream()
                        .map(OotdPostHashtag::getHashtag)
                        .map(OotdHashtag::getName)
                        .sorted()
                        .toList(),
                post.getLikeCount(),
                post.getViewCount(),
                likedByMe,
                post.getCreatedAt(),
                author.getId(),
                author.getNickname(),
                profile == null ? null : profile.getProfileImageUrl(),
                post.getComments().stream()
                        .sorted(Comparator.comparing(OotdComment::getCreatedAt))
                        .map(this::toCommentResponse)
                        .toList()
        );
    }

    private List<OotdPostImage> sortedImages(OotdPost post) {
        return post.getImages().stream()
                .sorted(Comparator.comparing(OotdPostImage::getImageOrder))
                .toList();
    }

    private OotdPostImageResponse toImageResponse(OotdPostImage image) {
        return new OotdPostImageResponse(
                image.getId(),
                image.getImageUrl(),
                image.getImageOrder(),
                image.getBrandTags().stream()
                        .map(this::toBrandTagResponse)
                        .toList()
        );
    }

    private OotdBrandTagResponse toBrandTagResponse(OotdImageBrandTag brandTag) {
        return new OotdBrandTagResponse(
                brandTag.getId(),
                brandTag.getBrandName(),
                brandTag.getShopUrl(),
                brandTag.getPositionX(),
                brandTag.getPositionY()
        );
    }

    private OotdCommentResponse toCommentResponse(OotdComment comment) {
        User author = comment.getAuthor();
        UserProfile profile = author.getProfile();
        return new OotdCommentResponse(
                comment.getId(),
                comment.getContent(),
                comment.getCreatedAt(),
                author.getId(),
                author.getNickname(),
                profile == null ? null : profile.getProfileImageUrl()
        );
    }
}
