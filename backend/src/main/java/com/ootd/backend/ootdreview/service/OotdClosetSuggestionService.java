package com.ootd.backend.ootdreview.service;

import com.ootd.backend.closet.entity.ClosetCategory;
import com.ootd.backend.closet.entity.ClosetFit;
import com.ootd.backend.closet.entity.ClosetItem;
import com.ootd.backend.closet.entity.ClosetSeason;
import com.ootd.backend.closet.repository.ClosetItemRepository;
import com.ootd.backend.ootdreview.dto.OotdClosetSuggestionItemResponse;
import com.ootd.backend.ootdreview.dto.OotdClosetSuggestionsResponse;
import com.ootd.backend.ootdreview.entity.OotdReview;
import com.ootd.backend.ootdreview.exception.OotdReviewAccessDeniedException;
import com.ootd.backend.ootdreview.exception.OotdReviewNotFoundException;
import com.ootd.backend.ootdreview.repository.OotdReviewRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.EnumSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class OotdClosetSuggestionService {

    private final OotdReviewRepository ootdReviewRepository;
    private final ClosetItemRepository closetItemRepository;

    @Transactional(readOnly = true)
    public OotdClosetSuggestionsResponse suggestFromReview(Long userId, Long reviewId) {
        OotdReview review = ootdReviewRepository.findById(Objects.requireNonNull(reviewId))
                .orElseThrow(() -> new OotdReviewNotFoundException("OOTD review was not found"));

        if (!review.getUserId().equals(userId)) {
            throw new OotdReviewAccessDeniedException("You cannot access other user's review");
        }

        List<ClosetItem> closetItems = closetItemRepository.findByUserIdAndIsActiveTrueOrderByCreatedAtDesc(userId);
        if (closetItems.isEmpty()) {
            return new OotdClosetSuggestionsResponse(List.of(), "추천 가능한 옷장 아이템이 없습니다.");
        }

        FeedbackProfile profile = parseFeedback(review);
        List<OotdClosetSuggestionItemResponse> suggestions = recommend(closetItems, profile);

        if (suggestions.isEmpty()) {
            return new OotdClosetSuggestionsResponse(List.of(), "추천 가능한 옷장 아이템이 없습니다.");
        }
        return new OotdClosetSuggestionsResponse(suggestions, "OOTD 피드백을 반영해 옷장 대체 아이템을 추천했습니다.");
    }

    private List<OotdClosetSuggestionItemResponse> recommend(List<ClosetItem> closetItems, FeedbackProfile profile) {
        Set<ClosetCategory> targetCategories = profile.targetCategories().isEmpty()
                ? EnumSet.of(ClosetCategory.TOP, ClosetCategory.BOTTOM)
                : profile.targetCategories();

        Map<ClosetCategory, List<ClosetItem>> byCategory = closetItems.stream()
                .collect(Collectors.groupingBy(ClosetItem::getCategory));

        List<OotdClosetSuggestionItemResponse> results = new ArrayList<>();
        for (ClosetCategory category : targetCategories) {
            List<ClosetItem> candidates = byCategory.getOrDefault(category, List.of());
            if (candidates.isEmpty()) {
                continue;
            }

            ClosetItem best = candidates.stream()
                    .max(Comparator.comparingInt(item -> score(item, profile, category)))
                    .orElse(null);
            if (best == null) {
                continue;
            }

            results.add(new OotdClosetSuggestionItemResponse(
                    toSlot(category),
                    best.getId(),
                    best.getCategory(),
                    best.getFit(),
                    best.getColor(),
                    best.getImageUrl(),
                    buildReason(best, profile, category)
            ));
        }
        return results;
    }

    private int score(ClosetItem item, FeedbackProfile profile, ClosetCategory category) {
        int score = 0;

        if (profile.preferredFits().contains(item.getFit())) {
            score += 6;
        }
        if (profile.colorTone() != ColorTone.UNKNOWN) {
            score += colorToneScore(item.getColor(), profile.colorTone());
        }
        if (item.getSeason() == ClosetSeason.ALL || item.getSeason() == currentSeason()) {
            score += 2;
        }
        if (item.getCreatedAt() != null) {
            long days = Math.max(0, Duration.between(item.getCreatedAt(), LocalDateTime.now()).toDays());
            score += days <= 30 ? 1 : 0;
        }
        // Slight category-specific preference hook for future extension
        if (category == ClosetCategory.OUTER && item.getSubcategory() != null && item.getSubcategory().toLowerCase(Locale.ROOT).contains("자켓")) {
            score += 1;
        }
        return score;
    }

    private int colorToneScore(String color, ColorTone tone) {
        if (color == null || color.isBlank()) {
            return 0;
        }
        String c = color.toLowerCase(Locale.ROOT);
        Set<String> light = Set.of("white", "ivory", "beige", "cream", "light", "밝", "아이보리", "베이지", "화이트");
        Set<String> dark = Set.of("black", "navy", "charcoal", "gray", "dark", "어두", "블랙", "네이비", "차콜", "그레이");
        Set<String> vivid = Set.of("red", "blue", "green", "yellow", "orange", "핑크", "레드", "블루", "그린", "옐로");

        return switch (tone) {
            case LIGHT -> light.stream().anyMatch(c::contains) ? 4 : 0;
            case DARK -> dark.stream().anyMatch(c::contains) ? 4 : 0;
            case CONTRAST -> (light.stream().anyMatch(c::contains) || dark.stream().anyMatch(c::contains) || vivid.stream().anyMatch(c::contains)) ? 3 : 0;
            case UNKNOWN -> 0;
        };
    }

    private String buildReason(ClosetItem item, FeedbackProfile profile, ClosetCategory category) {
        List<String> reasons = new ArrayList<>();
        if (profile.preferredFits().contains(item.getFit())) {
            reasons.add(item.getFit().name() + " 핏 피드백을 반영했습니다.");
        }
        if (profile.colorTone() == ColorTone.LIGHT) {
            reasons.add("밝은 톤 컬러 피드백을 반영한 추천입니다.");
        } else if (profile.colorTone() == ColorTone.DARK) {
            reasons.add("어두운 톤 컬러 피드백을 반영한 추천입니다.");
        } else if (profile.colorTone() == ColorTone.CONTRAST) {
            reasons.add("대비감 있는 컬러 피드백을 반영한 추천입니다.");
        }
        reasons.add(category.name() + " 카테고리 대체 아이템으로 적합합니다.");
        return String.join(" ", reasons);
    }

    private FeedbackProfile parseFeedback(OotdReview review) {
        String fitFeedback = normalize(review.getFitFeedback());
        String colorFeedback = normalize(review.getColorFeedback());
        String overallFeedback = normalize(review.getOverallFeedback());
        String all = fitFeedback + " " + colorFeedback + " " + overallFeedback;

        Set<ClosetFit> fits = EnumSet.noneOf(ClosetFit.class);
        if (containsAny(all, "와이드", "wide")) {
            fits.add(ClosetFit.WIDE);
        }
        if (containsAny(all, "슬림", "slim")) {
            fits.add(ClosetFit.SLIM);
        }
        if (containsAny(all, "오버핏", "오버", "overfit", "over")) {
            fits.add(ClosetFit.OVER);
        }
        if (fits.isEmpty()) {
            fits.add(ClosetFit.REGULAR);
        }

        ColorTone tone = ColorTone.UNKNOWN;
        if (containsAny(all, "밝은", "밝게", "light", "화이트", "베이지")) {
            tone = ColorTone.LIGHT;
        } else if (containsAny(all, "어두운", "dark", "블랙", "네이비")) {
            tone = ColorTone.DARK;
        } else if (containsAny(all, "대비", "contrast", "포인트")) {
            tone = ColorTone.CONTRAST;
        }

        Set<ClosetCategory> categories = EnumSet.noneOf(ClosetCategory.class);
        if (containsAny(all, "상의", "티셔츠", "셔츠", "니트", "top")) {
            categories.add(ClosetCategory.TOP);
        }
        if (containsAny(all, "하의", "바지", "팬츠", "데님", "스커트", "bottom")) {
            categories.add(ClosetCategory.BOTTOM);
        }
        if (containsAny(all, "아우터", "자켓", "코트", "점퍼", "outer")) {
            categories.add(ClosetCategory.OUTER);
        }
        if (containsAny(all, "신발", "슈즈", "shoes")) {
            categories.add(ClosetCategory.SHOES);
        }
        if (containsAny(all, "액세서리", "악세", "accessory")) {
            categories.add(ClosetCategory.ACCESSORY);
        }

        return new FeedbackProfile(fits, tone, categories);
    }

    private String normalize(String input) {
        return input == null ? "" : input.toLowerCase(Locale.ROOT);
    }

    private boolean containsAny(String source, String... keywords) {
        for (String keyword : keywords) {
            if (source.contains(keyword.toLowerCase(Locale.ROOT))) {
                return true;
            }
        }
        return false;
    }

    private String toSlot(ClosetCategory category) {
        return category.name();
    }

    private ClosetSeason currentSeason() {
        int month = LocalDate.now().getMonthValue();
        if (month >= 3 && month <= 5) {
            return ClosetSeason.SPRING;
        }
        if (month >= 6 && month <= 8) {
            return ClosetSeason.SUMMER;
        }
        if (month >= 9 && month <= 11) {
            return ClosetSeason.AUTUMN;
        }
        return ClosetSeason.WINTER;
    }

    private enum ColorTone {
        LIGHT,
        DARK,
        CONTRAST,
        UNKNOWN
    }

    private record FeedbackProfile(Set<ClosetFit> preferredFits, ColorTone colorTone, Set<ClosetCategory> targetCategories) {
    }
}
