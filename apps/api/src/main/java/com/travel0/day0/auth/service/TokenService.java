package com.travel0.day0.auth.service;

import com.travel0.day0.auth.domain.RefreshToken;
import com.travel0.day0.auth.repository.RefreshTokenRepository;
import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.Date;
import java.util.UUID;

@Component
@RequiredArgsConstructor
@Slf4j
public class TokenService {

    private final RefreshTokenRepository refreshTokenRepo;

    @Value("${jwt.secret}")
    private String secretKey;

    private final long tokenValidityInMilliseconds = 1000 * 60 * 60 * 24 * 14; // 2주

    private SecretKey getSigningKey() {
        return Keys.hmacShaKeyFor(secretKey.getBytes(StandardCharsets.UTF_8));
    }

    /**
     * JWT 생성
     */
    public String createToken(String email) {
        Date now = new Date();
        Date expiry = new Date(now.getTime() + tokenValidityInMilliseconds);

        return Jwts.builder()
                .subject(email)
                .issuedAt(now)
                .expiration(expiry)
                .signWith(getSigningKey())  // SignatureAlgorithm은 enum이 아닌 Jwts.SIG 사용
                .compact();
    }

    @Transactional
    public String createRefreshToken(String email) {
        refreshTokenRepo.deleteByEmail(email);

        String token = UUID.randomUUID().toString();
        LocalDateTime expiryDate = LocalDateTime.now().plusDays(14);

        RefreshToken refreshToken = new RefreshToken(token, email, expiryDate);
        refreshTokenRepo.save(refreshToken);

        return token;
    }
    /**
     * JWT 유효성 검사
     */
    public boolean validateToken(String token) {
        try {
            Jwts.parser()
                    .verifyWith(getSigningKey())
                    .build()
                    .parseSignedClaims(token);
            return true;
        } catch (JwtException | IllegalArgumentException e) {
            log.warn("Invalid JWT: {}", e.getMessage());
            return false;
        }
    }

    public boolean validateRefreshToken(String token){
        return refreshTokenRepo.findByToken(token)
                .map(refreshToken -> !refreshToken.isExpired())
                .orElse(false);
    }

    /**
     * JWT에서 사용자 이메일 추출
     */
    public String getEmailFromToken(String token) {
        return Jwts.parser()
                .verifyWith(getSigningKey())
                .build()
                .parseSignedClaims(token)
                .getPayload()
                .getSubject();
    }

    public String getEmailFromRefreshToken(String token){
        return refreshTokenRepo.findByToken(token)
                .map(RefreshToken::getEmail)
                .orElse(null);
    }

    public String resolveAccessToken(HttpServletRequest request) {
        // Authorization 헤더
        String header = request.getHeader("Authorization");
        if (header != null && header.startsWith("Bearer ")) {
            return header.replace("Bearer ", "");
        }

        // HttpOnly Cookie
        if (request.getCookies() != null) {
            for (Cookie cookie : request.getCookies()) {
                if ("accessToken".equals(cookie.getName())) {
                    return cookie.getValue();
                }
            }
        }
        return null;
    }

    @Transactional
    public void deleteRefreshToken(String email) {
        refreshTokenRepo.deleteByEmail(email);
    }
}
