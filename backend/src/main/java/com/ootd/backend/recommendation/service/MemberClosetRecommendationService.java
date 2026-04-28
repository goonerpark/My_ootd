package com.ootd.backend.recommendation.service;

import com.ootd.backend.closet.entity.ClosetCategory;
import com.ootd.backend.closet.entity.ClosetItem;
import com.ootd.backend.closet.entity.ClosetSeason;
import com.ootd.backend.closet.entity.ClosetThickness;
import com.ootd.backend.closet.repository.ClosetItemRepository;
import com.ootd.backend.recommendation.dto.TodayClosetRecommendedItemResponse;
import com.ootd.backend.recommendation.dto.TodayClosetRecommendationResponse;
import com.ootd.backend.recommendation.entity.DailyRecommendation;
import com.ootd.backend.recommendation.entity.RecommendationSlot;
import com.ootd.backend.recommendation.entity.RecommendationType;
import com.ootd.backend.recommendation.entity.RecommendedClosetItem;
import com.ootd.backend.recommendation.repository.DailyRecommendationRepository;
import com.ootd.backend.recommendation.repository.RecommendedClosetItemRepository;
import com.ootd.backend.survey.entity.SurveyAnswer;
import com.ootd.backend.survey.service.SurveyService;
import com.ootd.backend.user.entity.Gender;
import com.ootd.backend.user.entity.User;
import com.ootd.backend.user.repository.UserRepository;
import com.ootd.backend.weather.dto.TodayWeatherResponse;
import com.ootd.backend.weather.entity.WeatherCache;
import com.ootd.backend.weather.service.WeatherQueryService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.EnumMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class MemberClosetRecommendationService {

    private final UserRepository userRepository;
    private final WeatherQueryService weatherQueryService;
    private final SurveyService surveyService;
    private final ClosetItemRepository closetItemRepository;
    private final DailyRecommendationRepository dailyRecommendationRepository;
    private final RecommendedClosetItemRepository recommendedClosetItemRepository;

    @Transactional
    public TodayClosetRecommendationResponse getTodayClosetRecommendation(Long userId) {
        User user = userRepository.findById(Objects.requireNonNull(userId))
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        WeatherCache weatherCache = weatherQueryService.getOrFetchTodayWeatherCache();
        TodayWeatherResponse weather = weatherQueryService.toResponse(weatherCache);
        SurveyAnswer survey = surveyService.findTodaySurveyOrNull(userId);
        List<ClosetItem> activeItems = closetItemRepository.findByUserIdAndIsActiveTrueOrderByCreatedAtDesc(userId);

        WeatherCondition condition = toWeatherCondition(weather);
        FallbackDraft fallback = buildFallbackDraft(condition, user.getGender());

        Map<RecommendationSlot, PickedClosetItem> pickedMap = pickClosetItems(activeItems, condition, survey);
        SlotTexts slotTexts = composeSlotTexts(pickedMap, fallback, condition);
        String summaryComment = buildSummary(pickedMap, condition, survey, fallback.summaryComment());

        DailyRecommendation recommendation = upsertDailyRecommendation(
                userId,
                weatherCache,
                user.getGender(),
                slotTexts,
                summaryComment
        );

        saveRecommendedClosetMappings(recommendation.getId(), pickedMap);

        return new TodayClosetRecommendationResponse(
                weatherCache.getTargetDate(),
                RecommendationType.MEMBER_CLOSET,
                weather,
                slotTexts.top(),
                slotTexts.outer(),
                slotTexts.bottom(),
                slotTexts.shoes(),
                slotTexts.accessory(),
                summaryComment,
                toClosetItemResponses(pickedMap)
        );
    }

    private Map<RecommendationSlot, PickedClosetItem> pickClosetItems(
            List<ClosetItem> activeItems,
            WeatherCondition condition,
            SurveyAnswer survey
    ) {
        Map<RecommendationSlot, PickedClosetItem> picked = new EnumMap<>(RecommendationSlot.class);

        for (RecommendationSlot slot : RecommendationSlot.values()) {
            if (slot == RecommendationSlot.OUTER && condition.canSkipOuter()) {
                continue;
            }

            ClosetCategory category = toCategory(slot);
            Optional<ClosetItem> best = activeItems.stream()
                    .filter(item -> item.getCategory() == category)
                    .max(Comparator.comparingInt(item -> scoreItem(item, slot, condition, survey)));

            best.ifPresent(item -> picked.put(slot, new PickedClosetItem(item, buildReason(slot, item, condition, survey))));
        }

        return picked;
    }

    private int scoreItem(ClosetItem item, RecommendationSlot slot, WeatherCondition condition, SurveyAnswer survey) {
        int score = 0;

        score += seasonScore(item.getSeason(), condition);
        score += thicknessScore(item.getThickness(), slot, condition);
        score += fitScore(item, survey);
        score += rainScore(item, slot, condition);
        score += recencyScore(item);

        return score;
    }

    private int seasonScore(ClosetSeason season, WeatherCondition condition) {
        if (season == null) {
            return 1;
        }
        if (season == ClosetSeason.ALL) {
            return 3;
        }
        return season == condition.currentSeason() ? 5 : 1;
    }

    private int thicknessScore(ClosetThickness thickness, RecommendationSlot slot, WeatherCondition condition) {
        if (slot == RecommendationSlot.ACCESSORY || slot == RecommendationSlot.SHOES) {
            return 1;
        }
        ClosetThickness value = thickness == null ? ClosetThickness.NORMAL : thickness;

        if (condition.hot()) {
            return switch (value) {
                case THIN -> 6;
                case NORMAL -> 2;
                case THICK -> -3;
            };
        }
        if (condition.cold()) {
            return switch (value) {
                case THICK -> 6;
                case NORMAL -> 3;
                case THIN -> -2;
            };
        }
        if (condition.chilly()) {
            return switch (value) {
                case THICK -> 4;
                case NORMAL -> 5;
                case THIN -> 0;
            };
        }
        return switch (value) {
            case THIN -> 3;
            case NORMAL -> 5;
            case THICK -> 1;
        };
    }

    private int fitScore(ClosetItem item, SurveyAnswer survey) {
        if (survey == null || survey.getOutingPurpose() == null) {
            return 1;
        }

        String fit = item.getFit() == null ? "UNKNOWN" : item.getFit().name();
        return switch (survey.getOutingPurpose()) {
            case WORK, FORMAL -> ("REGULAR".equals(fit) || "SLIM".equals(fit)) ? 4 : 1;
            case EXERCISE, TRAVEL -> ("OVER".equals(fit) || "REGULAR".equals(fit)) ? 4 : 1;
            case DATE -> ("SLIM".equals(fit) || "REGULAR".equals(fit)) ? 3 : 1;
            default -> 2;
        };
    }

    private int rainScore(ClosetItem item, RecommendationSlot slot, WeatherCondition condition) {
        if (slot != RecommendationSlot.SHOES || !condition.rainy()) {
            return 0;
        }
        int score = 0;
        String sub = item.getSubcategory() == null ? "" : item.getSubcategory().toLowerCase();
        String memo = item.getMemo() == null ? "" : item.getMemo().toLowerCase();
        String color = item.getColor() == null ? "" : item.getColor().toLowerCase();

        if (sub.contains("방수") || sub.contains("rain") || memo.contains("방수")) {
            score += 4;
        }
        if (color.contains("black") || color.contains("navy") || color.contains("brown") || color.contains("gray")) {
            score += 2;
        }
        return score;
    }

    private int recencyScore(ClosetItem item) {
        if (item.getCreatedAt() == null) {
            return 0;
        }
        long days = Math.max(0, java.time.Duration.between(item.getCreatedAt(), LocalDateTime.now()).toDays());
        if (days <= 14) {
            return 2;
        }
        if (days <= 60) {
            return 1;
        }
        return 0;
    }

    private ClosetCategory toCategory(RecommendationSlot slot) {
        return switch (slot) {
            case TOP -> ClosetCategory.TOP;
            case OUTER -> ClosetCategory.OUTER;
            case BOTTOM -> ClosetCategory.BOTTOM;
            case SHOES -> ClosetCategory.SHOES;
            case ACCESSORY -> ClosetCategory.ACCESSORY;
        };
    }

    private SlotTexts composeSlotTexts(
            Map<RecommendationSlot, PickedClosetItem> pickedMap,
            FallbackDraft fallback,
            WeatherCondition condition
    ) {
        String top = pickedMap.containsKey(RecommendationSlot.TOP)
                ? toDisplayText(pickedMap.get(RecommendationSlot.TOP).item())
                : fallback.top();
        String outer = condition.canSkipOuter()
                ? "없음"
                : pickedMap.containsKey(RecommendationSlot.OUTER)
                ? toDisplayText(pickedMap.get(RecommendationSlot.OUTER).item())
                : fallback.outer();
        String bottom = pickedMap.containsKey(RecommendationSlot.BOTTOM)
                ? toDisplayText(pickedMap.get(RecommendationSlot.BOTTOM).item())
                : fallback.bottom();
        String shoes = pickedMap.containsKey(RecommendationSlot.SHOES)
                ? toDisplayText(pickedMap.get(RecommendationSlot.SHOES).item())
                : fallback.shoes();
        String accessory = pickedMap.containsKey(RecommendationSlot.ACCESSORY)
                ? toDisplayText(pickedMap.get(RecommendationSlot.ACCESSORY).item())
                : fallback.accessory();

        return new SlotTexts(top, outer, bottom, shoes, accessory);
    }

    private String buildSummary(
            Map<RecommendationSlot, PickedClosetItem> pickedMap,
            WeatherCondition condition,
            SurveyAnswer survey,
            String fallbackSummary
    ) {
        List<String> comments = new ArrayList<>();
        comments.add("오늘 날씨와 설문 조건을 반영해 옷장 아이템을 우선 추천했습니다.");

        if (condition.largeGap()) {
            comments.add("일교차가 커서 레이어드 또는 아우터 준비를 권장합니다.");
        }
        if (condition.rainy()) {
            comments.add("강수 가능성을 고려해 신발 선택을 보수적으로 추천했습니다.");
        }
        if (survey != null && survey.getOutingPurpose() != null) {
            comments.add("외출 목적(" + survey.getOutingPurpose().name() + ")을 반영했습니다.");
        }
        if (pickedMap.isEmpty()) {
            comments.add("옷장에 조건에 맞는 아이템이 부족해 기본 추천을 함께 사용했습니다.");
            comments.add(fallbackSummary);
        }

        String joined = String.join(" ", comments);
        return joined.length() > 500 ? joined.substring(0, 500) : joined;
    }

    private String toDisplayText(ClosetItem item) {
        String fit = item.getFit() == null || item.getFit().name().equals("UNKNOWN") ? "" : normalizeFit(item.getFit().name()) + " ";
        String color = item.getColor() == null || item.getColor().isBlank() ? "" : item.getColor().trim() + " ";
        String name = (item.getSubcategory() != null && !item.getSubcategory().isBlank())
                ? item.getSubcategory().trim()
                : item.getCategory().name();
        return (fit + color + name).trim();
    }

    private String normalizeFit(String fit) {
        return switch (fit) {
            case "SLIM" -> "슬림핏";
            case "REGULAR" -> "레귤러핏";
            case "OVER" -> "오버핏";
            case "WIDE" -> "와이드핏";
            default -> "";
        };
    }

    private String buildReason(RecommendationSlot slot, ClosetItem item, WeatherCondition condition, SurveyAnswer survey) {
        List<String> reasons = new ArrayList<>();
        reasons.add("현재 기온과 카테고리 조건에 맞는 " + slot.name() + " 아이템입니다.");

        if (condition.largeGap() && slot == RecommendationSlot.OUTER) {
            reasons.add("일교차 대응을 위해 아우터 우선순위를 높였습니다.");
        }
        if (condition.rainy() && slot == RecommendationSlot.SHOES) {
            reasons.add("강수 가능성을 반영해 물/오염에 상대적으로 부담이 적은 신발을 고려했습니다.");
        }
        if (survey != null && survey.getOutingPurpose() != null) {
            reasons.add("외출 목적(" + survey.getOutingPurpose().name() + ")을 반영했습니다.");
        }
        ClosetSeason season = item.getSeason();
        if (season == condition.currentSeason() || season == ClosetSeason.ALL) {
            reasons.add("현재 시즌과의 적합성을 고려했습니다.");
        }
        return String.join(" ", reasons);
    }

    private DailyRecommendation upsertDailyRecommendation(
            Long userId,
            WeatherCache weatherCache,
            Gender gender,
            SlotTexts slotTexts,
            String summaryComment
    ) {
        LocalDate targetDate = weatherCache.getTargetDate();
        DailyRecommendation recommendation = dailyRecommendationRepository
                .findByUserIdAndTargetDateAndRecommendationType(userId, targetDate, RecommendationType.MEMBER_CLOSET)
                .orElseGet(() -> DailyRecommendation.builder()
                        .userId(userId)
                        .targetDate(targetDate)
                        .gender(gender)
                        .weatherCacheId(weatherCache.getId())
                        .recommendationType(RecommendationType.MEMBER_CLOSET)
                        .topItem(slotTexts.top())
                        .outerItem(slotTexts.outer())
                        .bottomItem(slotTexts.bottom())
                        .shoesItem(slotTexts.shoes())
                        .accessoryItem(slotTexts.accessory())
                        .summaryComment(summaryComment)
                        .build());

        recommendation.update(
                weatherCache.getId(),
                gender,
                RecommendationType.MEMBER_CLOSET,
                slotTexts.top(),
                slotTexts.outer(),
                slotTexts.bottom(),
                slotTexts.shoes(),
                slotTexts.accessory(),
                summaryComment
        );

        return dailyRecommendationRepository.save(recommendation);
    }

    private void saveRecommendedClosetMappings(Long recommendationId, Map<RecommendationSlot, PickedClosetItem> pickedMap) {
        recommendedClosetItemRepository.deleteByRecommendationId(recommendationId);
        if (pickedMap.isEmpty()) {
            return;
        }

        List<RecommendedClosetItem> mappings = pickedMap.entrySet().stream()
                .map(entry -> RecommendedClosetItem.builder()
                        .recommendationId(recommendationId)
                        .closetItemId(entry.getValue().item().getId())
                        .recommendationSlot(entry.getKey())
                        .build())
                .toList();
        recommendedClosetItemRepository.saveAll(Objects.requireNonNull(mappings));
    }

    private List<TodayClosetRecommendedItemResponse> toClosetItemResponses(Map<RecommendationSlot, PickedClosetItem> pickedMap) {
        return pickedMap.entrySet().stream()
                .map(entry -> {
                    ClosetItem item = entry.getValue().item();
                    return new TodayClosetRecommendedItemResponse(
                            entry.getKey(),
                            item.getId(),
                            item.getCategory(),
                            item.getSubcategory(),
                            item.getColor(),
                            item.getSeason(),
                            item.getThickness(),
                            item.getFit(),
                            item.getBrand(),
                            item.getImageUrl(),
                            item.getMemo(),
                            entry.getValue().reason()
                    );
                })
                .toList();
    }

    private WeatherCondition toWeatherCondition(TodayWeatherResponse weather) {
        BigDecimal min = weather.minTemp();
        BigDecimal max = weather.maxTemp();
        BigDecimal current = weather.currentTemp() == null
                ? min.add(max).divide(BigDecimal.valueOf(2), 2, RoundingMode.HALF_UP)
                : weather.currentTemp();
        BigDecimal gap = max.subtract(min);
        BigDecimal pop = weather.precipitationProbability() == null ? BigDecimal.ZERO : weather.precipitationProbability();

        boolean hot = max.compareTo(BigDecimal.valueOf(25)) >= 0 || current.compareTo(BigDecimal.valueOf(24)) >= 0;
        boolean chilly = (max.compareTo(BigDecimal.valueOf(10)) >= 0 && max.compareTo(BigDecimal.valueOf(14)) <= 0)
                || (current.compareTo(BigDecimal.valueOf(10)) >= 0 && current.compareTo(BigDecimal.valueOf(14)) <= 0);
        boolean cold = max.compareTo(BigDecimal.valueOf(9)) <= 0 || current.compareTo(BigDecimal.valueOf(9)) <= 0;
        boolean largeGap = gap.compareTo(BigDecimal.valueOf(10)) >= 0;
        boolean rainy = pop.compareTo(BigDecimal.valueOf(40)) >= 0;

        return new WeatherCondition(
                hot,
                chilly,
                cold,
                largeGap,
                rainy,
                currentSeason(weather.targetDate()),
                hot && !largeGap
        );
    }

    private ClosetSeason currentSeason(LocalDate date) {
        int month = date.getMonthValue();
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

    private FallbackDraft buildFallbackDraft(WeatherCondition condition, Gender gender) {
        if (condition.hot()) {
            return new FallbackDraft(
                    gender == Gender.MALE ? "반팔 티셔츠" : "가벼운 반팔 상의",
                    "없음",
                    "얇은 팬츠",
                    "통기성 좋은 신발",
                    "모자 또는 선글라스",
                    "더운 날씨에는 아우터 없이 가벼운 코디를 추천합니다."
            );
        }
        if (condition.cold()) {
            return new FallbackDraft(
                    "기모 상의",
                    "두꺼운 코트 또는 패딩",
                    "보온 팬츠",
                    "보온성 있는 신발",
                    "목도리 또는 장갑",
                    "추운 날씨에는 보온 중심 코디를 추천합니다."
            );
        }
        if (condition.chilly()) {
            return new FallbackDraft(
                    "긴팔 상의",
                    "자켓",
                    "코튼 팬츠",
                    "기본 스니커즈",
                    "가벼운 액세서리",
                    "선선한 날씨에는 아우터를 포함한 코디를 추천합니다."
            );
        }
        return new FallbackDraft(
                "긴팔 티셔츠",
                "얇은 아우터",
                "청바지",
                "스니커즈",
                "크로스백",
                "평온한 날씨에 맞는 기본 코디를 추천합니다."
        );
    }

    private record PickedClosetItem(ClosetItem item, String reason) {
    }

    private record SlotTexts(String top, String outer, String bottom, String shoes, String accessory) {
    }

    private record FallbackDraft(String top, String outer, String bottom, String shoes, String accessory,
                                 String summaryComment) {
    }

    private record WeatherCondition(boolean hot,
                                    boolean chilly,
                                    boolean cold,
                                    boolean largeGap,
                                    boolean rainy,
                                    ClosetSeason currentSeason,
                                    boolean canSkipOuter) {
    }
}
