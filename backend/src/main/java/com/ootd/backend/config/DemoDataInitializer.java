package com.ootd.backend.config;

import com.ootd.backend.closet.entity.ClosetCategory;
import com.ootd.backend.closet.entity.ClosetFit;
import com.ootd.backend.closet.entity.ClosetItem;
import com.ootd.backend.closet.entity.ClosetSeason;
import com.ootd.backend.closet.entity.ClosetThickness;
import com.ootd.backend.closet.repository.ClosetItemRepository;
import com.ootd.backend.user.entity.BodyType;
import com.ootd.backend.user.entity.Gender;
import com.ootd.backend.user.entity.PersonalColor;
import com.ootd.backend.user.entity.Role;
import com.ootd.backend.user.entity.User;
import com.ootd.backend.user.entity.UserProfile;
import com.ootd.backend.user.repository.UserProfileRepository;
import com.ootd.backend.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

@Component
@Profile("!prod")
@RequiredArgsConstructor
public class DemoDataInitializer implements ApplicationRunner {

    public static final String DEMO_EMAIL = "demo@myootd.com";
    public static final String DEMO_PASSWORD = "Demo1234!";

    private final UserRepository userRepository;
    private final UserProfileRepository userProfileRepository;
    private final ClosetItemRepository closetItemRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        User demoUser = userRepository.findByEmail(DEMO_EMAIL)
                .orElseGet(() -> userRepository.save(User.builder()
                        .email(DEMO_EMAIL)
                        .password(passwordEncoder.encode(DEMO_PASSWORD))
                        .nickname(demoNickname())
                        .gender(Gender.FEMALE)
                        .role(Role.USER)
                        .isActive(true)
                        .build()));

        userProfileRepository.findByUserId(demoUser.getId())
                .orElseGet(() -> userProfileRepository.save(UserProfile.builder()
                        .user(demoUser)
                        .personalColor(PersonalColor.SUMMER_COOL)
                        .bodyType(BodyType.NORMAL)
                        .heightCm(BigDecimal.valueOf(165.0))
                        .weightKg(BigDecimal.valueOf(55.0))
                        .preferredStyle("미니멀 캐주얼")
                        .profileImageUrl(null)
                        .build()));

        if (closetItemRepository.findByUserIdAndIsActiveTrueOrderByCreatedAtDesc(demoUser.getId()).isEmpty()) {
            closetItemRepository.saveAll(List.of(
                    item(demoUser, ClosetCategory.OUTER, "트렌치 코트", "베이지", ClosetSeason.SPRING, ClosetThickness.NORMAL, ClosetFit.REGULAR, "Demo Closet", "일교차가 큰 날 입기 좋은 아우터"),
                    item(demoUser, ClosetCategory.TOP, "코튼 셔츠", "화이트", ClosetSeason.ALL, ClosetThickness.THIN, ClosetFit.REGULAR, "Demo Closet", "출근과 캐주얼 모두 가능한 기본 셔츠"),
                    item(demoUser, ClosetCategory.BOTTOM, "데님 팬츠", "인디고", ClosetSeason.ALL, ClosetThickness.NORMAL, ClosetFit.REGULAR, "Demo Closet", "어디에나 잘 어울리는 데님"),
                    item(demoUser, ClosetCategory.SHOES, "스니커즈", "화이트", ClosetSeason.ALL, ClosetThickness.NORMAL, ClosetFit.UNKNOWN, "Demo Closet", "오래 걸어도 편한 신발"),
                    item(demoUser, ClosetCategory.ACCESSORY, "미니 크로스백", "블랙", ClosetSeason.ALL, ClosetThickness.NORMAL, ClosetFit.UNKNOWN, "Demo Closet", "가벼운 외출용 가방")
            ));
        }
    }

    private ClosetItem item(
            User user,
            ClosetCategory category,
            String subcategory,
            String color,
            ClosetSeason season,
            ClosetThickness thickness,
            ClosetFit fit,
            String brand,
            String memo
    ) {
        return ClosetItem.builder()
                .userId(user.getId())
                .category(category)
                .subcategory(subcategory)
                .color(color)
                .season(season)
                .thickness(thickness)
                .fit(fit)
                .brand(brand)
                .imageUrl("https://placehold.co/600x800/f6f3f3/181c20?text=my_ootd")
                .memo(memo)
                .build();
    }

    private String demoNickname() {
        String base = "demo_myootd";
        if (!userRepository.existsByNickname(base)) {
            return base;
        }
        for (int i = 1; i <= 20; i++) {
            String candidate = base + "_" + i;
            if (!userRepository.existsByNickname(candidate)) {
                return candidate;
            }
        }
        return base + "_" + System.currentTimeMillis();
    }
}
