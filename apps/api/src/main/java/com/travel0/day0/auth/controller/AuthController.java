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
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Encoding;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
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
    @Operation(
            summary = "회원가입",
            requestBody = @io.swagger.v3.oas.annotations.parameters.RequestBody(
                    required = true,
                    content = @Content(
                            mediaType = MediaType.MULTIPART_FORM_DATA_VALUE,
                            schema = @Schema(implementation = RegisterMultipartDoc.class),
                            encoding = {
                                    @Encoding(name = "user", contentType = MediaType.APPLICATION_JSON_VALUE)
                            }
                    )
            )
    )
    public ResponseEntity<AuthResponse> register(
            @RequestPart("user") RegisterRequest request,
            @RequestPart(value = "profileImage", required = false) MultipartFile profileImage) {
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
            System.out.println("로그인 시작: " + request.getEmail());

            AuthResponse authResponse = authService.login(request);
            System.out.println("인증 서비스 완료");

            User user = userService.findByEmail(request.getEmail())
                    .orElseThrow(() -> new RuntimeException("사용자를 찾을 수 없습니다."));

            if(user.getUserKey() == null || user.getUserKey().isEmpty()){
                userKeyService.saveUserKey(user.getUserId(), finOpenApiProperties.getApiKey());
            }

            System.out.println("토큰 생성 시작");
            String accessToken = tokenService.createToken(request.getEmail());
            String refreshToken = tokenService.createRefreshToken(request.getEmail());

            System.out.println("생성된 토큰 확인:");
            System.out.println("Access Token: " + (accessToken != null ? "생성됨 (길이: " + accessToken.length() + ")" : "NULL"));
            System.out.println("Refresh Token: " + (refreshToken != null ? "생성됨 (길이: " + refreshToken.length() + ")" : "NULL"));

            if (accessToken == null || refreshToken == null) {
                throw new RuntimeException("토큰 생성에 실패했습니다");
            }

            System.out.println("쿠키 설정 시작");
            setTokenCookies(response, accessToken, refreshToken);
            System.out.println("쿠키 설정 완료");

            return ResponseEntity.ok(authResponse);
        } catch (Exception e) {
            System.out.println("로그인 예외 발생: " + e.getMessage());
            e.printStackTrace();
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
            return ResponseEntity.ok(new AuthResponse("인증된 사용자", email, userDetails.getUserId()));
        }
        return ResponseEntity.status(401)
                .body(new AuthResponse("인증되지 않은 사용자"));
    }

    private void setTokenCookies(HttpServletResponse response, String accessToken, String refreshToken) {
        System.out.println("setTokenCookies 메서드 진입");

        try {
            // 방법 1: 기존 Cookie 객체 사용
            setAccessTokenCookie(response, accessToken);
            setRefreshTokenCookie(response, refreshToken);
            System.out.println("Cookie 객체로 설정 완료");

            // 방법 2: 직접 헤더 설정 (백업용)
            response.addHeader("Set-Cookie",
                    String.format("accessToken=%s; Path=/; Max-Age=86400; SameSite=Lax", accessToken));
            response.addHeader("Set-Cookie",
                    String.format("refreshToken=%s; Path=/; HttpOnly; Max-Age=1209600; SameSite=Lax", refreshToken));
            System.out.println("직접 헤더 설정 완료");

        } catch (Exception e) {
            System.out.println("쿠키 설정 중 예외: " + e.getMessage());
            e.printStackTrace();
        }
    }

    private void setAccessTokenCookie(HttpServletResponse response, String accessToken) {
        try {
            Cookie accessCookie = new Cookie("accessToken", accessToken);
            accessCookie.setHttpOnly(false); // JS에서 읽을 수 있도록 변경
            accessCookie.setSecure(false); // 개발 환경
            accessCookie.setPath("/");
            accessCookie.setMaxAge(24 * 60 * 60); // 24시간
            response.addCookie(accessCookie);
            System.out.println("Access Token 쿠키 설정됨 (HttpOnly=false)");
        } catch (Exception e) {
            System.out.println("Access Token 쿠키 설정 실패: " + e.getMessage());
        }
    }

    private void setRefreshTokenCookie(HttpServletResponse response, String refreshToken) {
        try {
            Cookie refreshCookie = new Cookie("refreshToken", refreshToken);
            refreshCookie.setHttpOnly(true); // 리프레시 토큰은 보안상 HttpOnly 유지
            refreshCookie.setSecure(false); // 개발 환경
            refreshCookie.setPath("/");
            refreshCookie.setMaxAge(14 * 24 * 60 * 60); // 14일
            response.addCookie(refreshCookie);
            System.out.println("Refresh Token 쿠키 설정됨");
        } catch (Exception e) {
            System.out.println("Refresh Token 쿠키 설정 실패: " + e.getMessage());
        }
    }

    private void clearTokenCookies(HttpServletResponse response) {
        Cookie accessCookie = new Cookie("accessToken", null);
        accessCookie.setHttpOnly(false);
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

    /** 문서용 스키마: Swagger UI 표시 용 */
    class RegisterMultipartDoc {
        @Schema(description = "회원가입 본문(JSON 객체)", implementation = RegisterRequest.class)
        public RegisterRequest user;

        @Schema(description = "프로필 이미지 파일", type = "string", format = "binary")
        public MultipartFile profileImage;
    }
}
