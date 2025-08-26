package com.travel0.day0.auth.service;

import com.travel0.day0.auth.dto.AuthResponse;
import com.travel0.day0.auth.dto.LoginRequest;
import com.travel0.day0.auth.dto.RegisterRequest;
import com.travel0.day0.finopenapi.client.UserOpenApiClient;
import com.travel0.day0.finopenapi.config.FinOpenApiProperties;
import com.travel0.day0.finopenapi.dto.UserExternalDtos;
import com.travel0.day0.users.domain.University;
import com.travel0.day0.users.domain.User;
import com.travel0.day0.users.repository.UniversityRepository;
import com.travel0.day0.users.repository.UserRepository;
import com.travel0.day0.users.service.FileService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

@Service
@Slf4j
@RequiredArgsConstructor
@Transactional
public class AuthService {
    private final UserRepository userRepo;
    private final FileService fileService;
    private final UniversityRepository universityRepo;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final TokenService tokenService;
    private final FinOpenApiProperties finOpenApiProperties;
    private final UserOpenApiClient userOpenApiClient;


    @Transactional
    public AuthResponse register(RegisterRequest request, MultipartFile profileImage) {
        if (userRepo.existsByEmail(request.getEmail())) {
            throw new IllegalArgumentException("이미 존재하는 이메일입니다.");
        }

        if(profileImage != null && !profileImage.isEmpty()){
            String imageUrl = fileService.saveProfileImage(profileImage);
            request.setProfileImage(imageUrl);
        }

        University homeUniv = null;
        if (request.getHomeUniversityId() != null) {
            homeUniv = universityRepo.findById(request.getHomeUniversityId())
                    .orElseThrow(() -> new RuntimeException("대학을 찾을 수 없습니다."));
        }

        University destUniv = null;
        if (request.getDestUniversityId() != null) {
            destUniv = universityRepo.findById(request.getDestUniversityId())
                    .orElseThrow(() -> new RuntimeException("대학을 찾을 수 없습니다."));
        }

        User user = User.builder()
                .name(request.getName())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .nickname(request.getNickname())
                .gender(request.getGender())
                .birth(request.getBirth())
                .profileImage(request.getProfileImage())
                .homeUniversity(homeUniv)
                .destUniversity(destUniv)
                .build();

        User savedUser = userRepo.save(user);

        // 금융 API 사용자 등록 및 userKey 저장
        try {
            String apiKey = finOpenApiProperties.getApiKey();
            UserExternalDtos.MemberRes memberRes = userOpenApiClient.createMember(apiKey, request.getEmail());
            savedUser.setUserKey(memberRes.userKey());
            userRepo.save(savedUser);
            log.info("userKey 저장 완료: {}", memberRes.userKey());
        } catch (Exception e) {
            log.error("userKey 생성 실패: {}", e.getMessage());
        }

        return new AuthResponse("회원가입이 완료되었습니다.", user.getEmail(), user.getUserId());
    }

    public AuthResponse login(LoginRequest request) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        request.getEmail(),
                        request.getPassword()
                )
        );

        String email = authentication.getName();
        User user = userRepo.findByEmail(email)
                .orElseThrow(()->new IllegalArgumentException("사용자를 찾을 수 없습니다."));
        return new AuthResponse("로그인 성공", email, user.getUserId());
    }

    public AuthResponse logout(String email) {
        tokenService.deleteRefreshToken(email);
        return new AuthResponse("로그아웃 되었습니다.");
    }

    public String refreshAccessToken(String refreshToken) {
        if (!tokenService.validateRefreshToken(refreshToken)) {
            throw new IllegalArgumentException("유효하지 않은 리프레시 토큰입니다.");
        }

        String email = tokenService.getEmailFromRefreshToken(refreshToken);
        return tokenService.createToken(email);
    }
}

