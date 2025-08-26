package com.travel0.day0.auth.controller;

import com.travel0.day0.auth.dto.AuthResponse;
import com.travel0.day0.auth.dto.LoginRequest;
import com.travel0.day0.auth.dto.RegisterRequest;
import com.travel0.day0.auth.service.AuthService;
import com.travel0.day0.auth.service.PrincipalDetails;
import com.travel0.day0.auth.service.TokenService;
import com.travel0.day0.finopenapi.client.UserOpenApiClient;
import com.travel0.day0.finopenapi.config.FinOpenApiProperties;
import com.travel0.day0.users.domain.User;
import com.travel0.day0.users.service.UserKeyService;
import com.travel0.day0.users.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
@Slf4j
public class AuthController {

    private final AuthService authService;
    private final TokenService tokenService;
    private final UserService userService;
    private final FinOpenApiProperties finOpenApiProperties;
    private final UserKeyService userKeyService;
    private final UserOpenApiClient userOpenApiClient;

    /**
     * 회원가입
     */
    @PostMapping("/register")
    @Operation(summary = "회원가입")
    public ResponseEntity<AuthResponse> register(
            @RequestPart("user") RegisterRequest request,
            @RequestPart(value = "profileImage", required = false)MultipartFile profileImage) {
        try {
            AuthResponse response = authService.register(request, profileImage);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest()
                    .body(new AuthResponse(e.getMessage()));
        }
    }

    /**
     * 로그인
     */
    @PostMapping("/login")
    @Operation(summary = "로그인")
    public ResponseEntity<AuthResponse> login(@RequestBody LoginRequest request,
                                              HttpServletResponse response) {
        try {
            AuthResponse authResponse = authService.login(request);

            User user = userService.findByEmail(request.getEmail())
                    .orElseThrow(() -> new RuntimeException("사용자를 찾을 수 없습니다."));

            if(user.getUserKey() == null || user.getUserKey().isEmpty()){
                userKeyService.saveUserKey(user.getUserId(), finOpenApiProperties.getApiKey());
            }
            String accessToken = tokenService.createToken(request.getEmail());
            String refreshToken = tokenService.createRefreshToken(request.getEmail());

            setTokenCookies(response, accessToken, refreshToken);

            return ResponseEntity.ok(authResponse);
        } catch (Exception e) {
            return ResponseEntity.status(401)
                    .body(new AuthResponse("로그인 실패: " + e.getMessage()));
        }
    }

    /**
     * 로그아웃
     */
    @PostMapping("/logout")
    @Operation(summary = "로그아웃")
    public ResponseEntity<AuthResponse> logout(Authentication authentication,
                                               HttpServletResponse response) {
        if (authentication != null) {
            String email = authentication.getName();
            AuthResponse authResponse = authService.logout(email);

            clearTokenCookies(response);

            return ResponseEntity.ok(authResponse);
        }
        return ResponseEntity.ok(new AuthResponse("로그아웃 되었습니다."));
    }

    /**
     * 토큰 갱신
     */
    @PostMapping("/refresh")
    @Operation(summary = "토큰 갱신")
    public ResponseEntity<AuthResponse> refresh(HttpServletRequest request,
                                                HttpServletResponse response) {
        try {
            String refreshToken = getRefreshTokenFromCookie(request);

            if (refreshToken == null) {
                return ResponseEntity.status(401)
                        .body(new AuthResponse("리프레시 토큰이 없습니다."));
            }

            String newAccessToken = authService.refreshAccessToken(refreshToken);

            setAccessTokenCookie(response, newAccessToken);

            return ResponseEntity.ok(new AuthResponse("토큰이 갱신되었습니다."));
        } catch (Exception e) {
            return ResponseEntity.status(401)
                    .body(new AuthResponse("토큰 갱신 실패: " + e.getMessage()));
        }
    }

    /**
     * 현재 사용자 정보
     */
    @GetMapping("/me")
    @Operation(summary = "현재 사용자 정보")
    public ResponseEntity<AuthResponse> getCurrentUser(@AuthenticationPrincipal PrincipalDetails userDetails) {
        if (userDetails != null) {
            String email = userDetails.getUsername();
            return ResponseEntity.ok(new AuthResponse("인증된 사용자", email, null));
        }
        return ResponseEntity.status(401)
                .body(new AuthResponse("인증되지 않은 사용자"));
    }

    private void setTokenCookies(HttpServletResponse response, String accessToken, String refreshToken) {
        setAccessTokenCookie(response, accessToken);
        setRefreshTokenCookie(response, refreshToken);
    }

    private void setAccessTokenCookie(HttpServletResponse response, String accessToken) {
        Cookie accessCookie = new Cookie("accessToken", accessToken);
        accessCookie.setHttpOnly(true);
        accessCookie.setSecure(false); // 개발환경에서는 false
        accessCookie.setPath("/");
        accessCookie.setMaxAge(24 * 60 * 60); // 24시간
        response.addCookie(accessCookie);
    }

    private void setRefreshTokenCookie(HttpServletResponse response, String refreshToken) {
        Cookie refreshCookie = new Cookie("refreshToken", refreshToken);
        refreshCookie.setHttpOnly(true);
        refreshCookie.setSecure(false); // 개발환경에서는 false
        refreshCookie.setPath("/");
        refreshCookie.setMaxAge(14 * 24 * 60 * 60); // 14일
        response.addCookie(refreshCookie);
    }

    private void clearTokenCookies(HttpServletResponse response) {
        Cookie accessCookie = new Cookie("accessToken", null);
        accessCookie.setHttpOnly(true);
        accessCookie.setPath("/");
        accessCookie.setMaxAge(0);
        response.addCookie(accessCookie);

        Cookie refreshCookie = new Cookie("refreshToken", null);
        refreshCookie.setHttpOnly(true);
        refreshCookie.setPath("/");
        refreshCookie.setMaxAge(0);
        response.addCookie(refreshCookie);
    }

    private String getRefreshTokenFromCookie(HttpServletRequest request) {
        if (request.getCookies() != null) {
            for (Cookie cookie : request.getCookies()) {
                if ("refreshToken".equals(cookie.getName())) {
                    return cookie.getValue();
                }
            }
        }
        return null;
    }
}