package com.ootd.backend.ootdreview.service;

import com.ootd.backend.ootdreview.ai.client.OotdEvaluationClient;
import com.ootd.backend.ootdreview.ai.dto.OotdEvaluationResult;
import com.ootd.backend.ootdreview.dto.CreateOotdReviewRequest;
import com.ootd.backend.ootdreview.dto.OotdReviewResponse;
import com.ootd.backend.ootdreview.entity.OotdReview;
import com.ootd.backend.ootdreview.entity.OotdReviewImage;
import com.ootd.backend.ootdreview.exception.OotdReviewAccessDeniedException;
import com.ootd.backend.ootdreview.exception.OotdReviewNotFoundException;
import com.ootd.backend.ootdreview.repository.OotdReviewRepository;
import com.ootd.backend.ootdreview.storage.OotdImageStorageClient;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDate;
import java.util.List;
import java.util.Objects;

@Service
@RequiredArgsConstructor
public class OotdReviewService {

    private final OotdReviewRepository ootdReviewRepository;
    private final OotdImageStorageClient imageStorageClient;
    private final OotdEvaluationClient ootdEvaluationClient;

    @Transactional
    public OotdReviewResponse createReview(Long userId, CreateOotdReviewRequest request) {
        LocalDate reviewDate = request.getReviewDate() != null ? request.getReviewDate() : LocalDate.now();
        List<MultipartFile> imageFiles = request.getImages().stream()
                .filter(file -> file != null && !file.isEmpty())
                .toList();

        List<String> imageUrls = imageFiles.stream()
                .map(imageStorageClient::store)
                .toList();
        if (imageUrls.isEmpty()) {
            throw new IllegalArgumentException("at least one non-empty image is required");
        }

        OotdEvaluationResult evaluation = ootdEvaluationClient.evaluate(imageFiles, request.getNotes());

        OotdReview review = OotdReview.builder()
                .userId(userId)
                .reviewDate(reviewDate)
                .rating(evaluation.rating())
                .fitFeedback(evaluation.fitFeedback())
                .colorFeedback(evaluation.colorFeedback())
                .overallFeedback(evaluation.overallFeedback())
                .aiModelVersion(evaluation.aiModelVersion())
                .build();

        imageUrls.forEach(review::addImage);

        OotdReview saved = ootdReviewRepository.save(review);
        return toResponse(saved);
    }

    @Transactional(readOnly = true)
    public List<OotdReviewResponse> getMyReviews(Long userId) {
        return ootdReviewRepository.findByUserIdOrderByReviewDateDescCreatedAtDesc(userId).stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public OotdReviewResponse getMyReview(Long userId, Long reviewId) {
        OotdReview review = ootdReviewRepository.findById(Objects.requireNonNull(reviewId))
                .orElseThrow(() -> new OotdReviewNotFoundException("OOTD review was not found"));

        if (!review.getUserId().equals(userId)) {
            throw new OotdReviewAccessDeniedException("You cannot access other user's review");
        }

        return toResponse(review);
    }

    private OotdReviewResponse toResponse(OotdReview review) {
        List<String> imageUrls = review.getImages().stream()
                .map(OotdReviewImage::getImageUrl)
                .toList();

        return new OotdReviewResponse(
                review.getId(),
                review.getUserId(),
                review.getReviewDate(),
                review.getRating(),
                review.getFitFeedback(),
                review.getColorFeedback(),
                review.getOverallFeedback(),
                review.getAiModelVersion(),
                review.getCreatedAt(),
                imageUrls
        );
    }
}
