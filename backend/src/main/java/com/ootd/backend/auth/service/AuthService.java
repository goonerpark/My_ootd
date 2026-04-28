package com.ootd.backend.auth.service;

import com.ootd.backend.auth.dto.LoginRequest;
import com.ootd.backend.auth.dto.LoginResponse;
import com.ootd.backend.auth.dto.SignUpRequest;
import com.ootd.backend.auth.dto.SignUpResponse;
import com.ootd.backend.security.jwt.JwtTokenProvider;
import com.ootd.backend.user.entity.BodyType;
import com.ootd.backend.user.entity.PersonalColor;
import com.ootd.backend.user.entity.Role;
import com.ootd.backend.user.entity.User;
import com.ootd.backend.user.entity.UserProfile;
import com.ootd.backend.user.exception.AuthenticationFailedException;
import com.ootd.backend.user.exception.DuplicateEmailException;
import com.ootd.backend.user.exception.DuplicateNicknameException;
import com.ootd.backend.user.repository.UserProfileRepository;
import com.ootd.backend.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Objects;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final UserProfileRepository userProfileRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;
    private final AuthenticationManager authenticationManager;

    @Transactional
    public SignUpResponse signUp(SignUpRequest request) {
        if (userRepository.existsByEmail(request.email())) {
            throw new DuplicateEmailException("Email is already in use");
        }
        if (userRepository.existsByNickname(request.nickname())) {
            throw new DuplicateNicknameException("Nickname is already in use");
        }

        User user = User.builder()
                .email(request.email())
                .password(passwordEncoder.encode(request.password()))
                .nickname(request.nickname())
                .gender(request.gender())
                .role(Role.USER)
                .isActive(true)
                .build();

        User savedUser = userRepository.save(Objects.requireNonNull(user));

        UserProfile profile = UserProfile.builder()
                .user(savedUser)
                .personalColor(PersonalColor.UNKNOWN)
                .bodyType(BodyType.UNKNOWN)
                .heightCm(null)
                .weightKg(null)
                .preferredStyle(null)
                .profileImageUrl(null)
                .build();
        userProfileRepository.save(Objects.requireNonNull(profile));

        return new SignUpResponse(
                savedUser.getId(),
                savedUser.getEmail(),
                savedUser.getNickname(),
                savedUser.getGender(),
                savedUser.getRole(),
                savedUser.getCreatedAt()
        );
    }

    @Transactional(readOnly = true)
    public LoginResponse login(LoginRequest request) {
        try {
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(request.email(), request.password())
            );
        } catch (BadCredentialsException ex) {
            throw new AuthenticationFailedException("Invalid email or password");
        } catch (DisabledException ex) {
            throw new AuthenticationFailedException("Inactive user");
        }

        User user = userRepository.findByEmail(request.email())
                .orElseThrow(() -> new AuthenticationFailedException("Invalid email or password"));

        String token = jwtTokenProvider.generateAccessToken(user.getId(), user.getEmail(), user.getRole().name());

        return new LoginResponse(
                token,
                "Bearer",
                jwtTokenProvider.getAccessTokenExpirationMs(),
                user.getId(),
                user.getEmail(),
                user.getNickname(),
                user.getGender()
        );
    }
}
