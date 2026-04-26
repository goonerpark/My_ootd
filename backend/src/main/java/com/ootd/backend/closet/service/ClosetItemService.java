package com.ootd.backend.closet.service;

import com.ootd.backend.closet.dto.ClosetItemResponse;
import com.ootd.backend.closet.dto.CreateClosetItemRequest;
import com.ootd.backend.closet.dto.UpdateClosetItemRequest;
import com.ootd.backend.closet.entity.ClosetFit;
import com.ootd.backend.closet.entity.ClosetItem;
import com.ootd.backend.closet.entity.ClosetSeason;
import com.ootd.backend.closet.entity.ClosetThickness;
import com.ootd.backend.closet.exception.ClosetItemAccessDeniedException;
import com.ootd.backend.closet.exception.ClosetItemNotFoundException;
import com.ootd.backend.closet.repository.ClosetItemRepository;
import com.ootd.backend.closet.storage.ClosetImageStorageClient;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ClosetItemService {

    private final ClosetItemRepository closetItemRepository;
    private final ClosetImageStorageClient closetImageStorageClient;

    @Transactional
    public ClosetItemResponse create(Long userId, CreateClosetItemRequest request) {
        String imageUrl = resolveImageUrl(request.getImageFile(), request.getImageUrl(), null);

        ClosetItem item = ClosetItem.builder()
                .userId(userId)
                .category(request.getCategory())
                .subcategory(request.getSubcategory())
                .color(request.getColor())
                .season(request.getSeason() != null ? request.getSeason() : ClosetSeason.ALL)
                .thickness(request.getThickness() != null ? request.getThickness() : ClosetThickness.NORMAL)
                .fit(request.getFit() != null ? request.getFit() : ClosetFit.UNKNOWN)
                .brand(request.getBrand())
                .imageUrl(imageUrl)
                .memo(request.getMemo())
                .build();

        ClosetItem saved = closetItemRepository.save(item);
        return toResponse(saved);
    }

    @Transactional(readOnly = true)
    public List<ClosetItemResponse> getMyItems(Long userId) {
        return closetItemRepository.findByUserIdAndIsActiveTrueOrderByCreatedAtDesc(userId).stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public ClosetItemResponse getMyItem(Long userId, Long itemId) {
        return toResponse(findOwnedActiveItem(userId, itemId));
    }

    @Transactional
    public ClosetItemResponse update(Long userId, Long itemId, UpdateClosetItemRequest request) {
        ClosetItem item = findOwnedActiveItem(userId, itemId);

        String imageUrl = resolveImageUrl(request.getImageFile(), request.getImageUrl(), item.getImageUrl());
        item.update(
                request.getCategory() != null ? request.getCategory() : item.getCategory(),
                request.getSubcategory() != null ? request.getSubcategory() : item.getSubcategory(),
                request.getColor() != null ? request.getColor() : item.getColor(),
                request.getSeason() != null ? request.getSeason() : item.getSeason(),
                request.getThickness() != null ? request.getThickness() : item.getThickness(),
                request.getFit() != null ? request.getFit() : item.getFit(),
                request.getBrand() != null ? request.getBrand() : item.getBrand(),
                imageUrl,
                request.getMemo() != null ? request.getMemo() : item.getMemo()
        );

        return toResponse(item);
    }

    @Transactional
    public void softDelete(Long userId, Long itemId) {
        ClosetItem item = findOwnedActiveItem(userId, itemId);
        item.softDelete();
    }

    private ClosetItem findOwnedActiveItem(Long userId, Long itemId) {
        ClosetItem item = closetItemRepository.findById(itemId)
                .orElseThrow(() -> new ClosetItemNotFoundException("Closet item was not found"));

        if (!item.getUserId().equals(userId)) {
            throw new ClosetItemAccessDeniedException("You cannot access other user's closet item");
        }

        if (!Boolean.TRUE.equals(item.getIsActive())) {
            throw new ClosetItemNotFoundException("Closet item was not found");
        }

        return item;
    }

    private String resolveImageUrl(MultipartFile imageFile, String imageUrl, String existingImageUrl) {
        if (imageFile != null && !imageFile.isEmpty()) {
            return closetImageStorageClient.store(imageFile);
        }
        if (imageUrl != null && !imageUrl.isBlank()) {
            return imageUrl.trim();
        }
        if (existingImageUrl != null && !existingImageUrl.isBlank()) {
            return existingImageUrl;
        }
        throw new IllegalArgumentException("imageFile or imageUrl is required");
    }

    private ClosetItemResponse toResponse(ClosetItem item) {
        return new ClosetItemResponse(
                item.getId(),
                item.getUserId(),
                item.getCategory(),
                item.getSubcategory(),
                item.getColor(),
                item.getSeason(),
                item.getThickness(),
                item.getFit(),
                item.getBrand(),
                item.getImageUrl(),
                item.getMemo(),
                item.getIsActive(),
                item.getCreatedAt(),
                item.getUpdatedAt()
        );
    }
}
